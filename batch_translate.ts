import { Project, SyntaxKind } from 'ts-morph';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const aiClient = new OpenAI({
  baseURL: process.env.AZURE_OPENAI_ENDPOINT || "https://gorgeous-ai-2.services.ai.azure.com/openai/v1",
  apiKey: process.env.AZURE_OPENAI_API_KEY || "",
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY || "" }
});
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-5.4";

async function run() {
  const project = new Project();
  project.addSourceFilesAtPaths("src/modules/finance/**/*.tsx");

  const stringsToTranslate = new Set();

  for (const sourceFile of project.getSourceFiles()) {
    // 1. Find JsxElements named TranslatableText
    const elements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement);
    for (const el of elements) {
      if (el.getOpeningElement().getTagNameNode().getText() === 'TranslatableText') {
        const textAttr = el.getOpeningElement().getAttribute('text');
        if (textAttr && textAttr.getKind() === SyntaxKind.JsxAttribute) {
          const init = textAttr.getInitializer();
          if (init && init.getKind() === SyntaxKind.StringLiteral) {
            stringsToTranslate.add(init.getLiteralText());
          }
        }
      }
    }
    
    // 2. Find self closing JsxSelfClosingElement named TranslatableText
    const selfClosing = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
    for (const el of selfClosing) {
      if (el.getTagNameNode().getText() === 'TranslatableText') {
        const textAttr = el.getAttribute('text');
        if (textAttr && textAttr.getKind() === SyntaxKind.JsxAttribute) {
          const init = textAttr.getInitializer();
          if (init && init.getKind() === SyntaxKind.StringLiteral) {
            stringsToTranslate.add(init.getLiteralText());
          }
        }
      }
    }

    // 3. Find t('text', 'text') calls
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of calls) {
      if (call.getExpression().getText() === 't') {
        const args = call.getArguments();
        if (args.length > 0 && args[0].getKind() === SyntaxKind.StringLiteral) {
          stringsToTranslate.add(args[0].getLiteralText());
        }
      }
    }
  }

  const allStrings = Array.from(stringsToTranslate);
  console.log(`Found ${allStrings.length} unique strings to translate.`);

  // Filter out those already in DB
  const existing = await prisma.translationCache.findMany({
    where: { targetLang: 'uz' },
    select: { sourceText: true }
  });
  const existingSet = new Set(existing.map(e => e.sourceText));

  const toTranslate = allStrings.filter(s => !existingSet.has(s) && /[А-Яа-яЁё]/.test(s));
  console.log(`Need to translate ${toTranslate.length} strings.`);

  const BATCH_SIZE = 50;
  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE);
    console.log(`Translating batch ${Math.floor(i/BATCH_SIZE)+1} of ${Math.ceil(toTranslate.length/BATCH_SIZE)}...`);
    
    const obj = {};
    batch.forEach((str, idx) => { obj[`str_${idx}`] = str; });

    const prompt = `You are a professional translator. Translate the following JSON values from Russian to Uzbek. Maintain the exact JSON keys. Only return the valid JSON object, no markdown, no explanations.\n\n${JSON.stringify(obj, null, 2)}`;
    
    try {
      const completion = await aiClient.chat.completions.create({
        model: deploymentName,
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });
      
      const responseStr = completion.choices?.[0]?.message?.content;
      if (responseStr) {
        const translatedObj = JSON.parse(responseStr);
        
        const creations = batch.map((str, idx) => ({
          sourceLang: 'ru',
          targetLang: 'uz',
          sourceText: str,
          translated: translatedObj[`str_${idx}`] || str
        }));
        
        await prisma.translationCache.createMany({
          data: creations,
          skipDuplicates: true
        });
        console.log(`Saved batch ${Math.floor(i/BATCH_SIZE)+1}`);
      }
    } catch (e) {
      console.error(`Error translating batch ${Math.floor(i/BATCH_SIZE)+1}:`, e.message);
    }
  }
  
  console.log("Translation complete!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
