import json

dict_uz = {
    "Показатели": "Ko'rsatkichlar",
    "ПРИБЫЛЬНОСТЬ ПРОЕКТОВ": "LOYIHALAR DAROMADLILIGI",
    "ВЫРУЧКА": "TUSHUM",
    "РАСХОДЫ": "XARAJATLAR",
    "ПРИБЫЛЬ": "FOYDA",
    "РЕНТАБЕЛЬНОСТЬ": "RENTABELLIK",
    "EBITDA": "EBITDA",
    "Денежный поток, сум": "Pul oqimi, so'm",
    "ПОСТУПЛЕНИЯ": "TUSHUMLAR",
    "ОТТОКИ": "CHIQIMLAR",
    "ЧИСТЫЙ ДЕНЕЖНЫЙ ПОТОК": "SOF PUL OQIMI",
    "Кассовый метод": "Kassa usuli",
    "Сортировка по прибыли": "Foyda bo'yicha saralash",
    "Сортировка по выручке": "Tushum bo'yicha saralash",
    "Общий": "Umumiy",
    "Операционный": "Operatsion",
    "Инвестиционный": "Investitsion",
    "Финансовый": "Moliyaviy",
    "янв": "yan", "фев": "fev", "мар": "mar", "апр": "apr", "май": "may", "июн": "iyn", 
    "июл": "iyl", "авг": "avg", "сен": "sen", "окт": "okt", "ноя": "noy", "дек": "dek",
    "январь": "yanvar", "февраль": "fevral", "март": "mart", "апрель": "aprel",
    "В разработке": "Ishlab chiqilmoqda",
    "Отчёты": "Hisobotlar",
    "Движение денег (ДДС)": "Pul harakati (PH)",
    "Прибыли и убытки (ОПУ)": "Foyda va zararlar",
    "Баланс": "Balans",
    "Справочники": "Ma'lumotnomalar",
    "Контрагенты": "Kontragentlar",
    "Учетные статьи": "Hisob moddalari",
    "Мои счета": "Mening hisoblarim",
    "Мои юрлица": "Mening yuridik shaxslarim",
    "Товары и услуги": "Tovarlar va xizmatlar",
    "Учет активов": "Aktivlar hisobi",
    "Кредиты и займы": "Kredit va qarzlar",
    "Казначейство": "G'aznachilik",
    "Документооборот": "Hujjat aylanishi",
    "Настройки": "Sozlamalar",
    "План": "Reja",
    "Платежный календарь": "To'lovlar taqvimi",
    "Бюджет доходов и расходов": "Daromad va xarajatlar byudjeti",
    "Бюджет движения денег": "Pul harakati byudjeti",
    "Проекты": "Loyihalar",
    "Сделки": "Bitimlar",
    "Продажи": "Sotuvlar",
    "Закупки": "Xaridlar",
    "Выставленные счета": "Taqdim etilgan hisoblar",
    "Операции": "Operatsiyalar"
}

with open('public/locales/uz/translation.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for k, v in data.items():
    if v.endswith(' [UZ]'):
        # Check direct match
        if k in dict_uz:
            data[k] = dict_uz[k]
        else:
            # Maybe upper/lower match
            for dk, dv in dict_uz.items():
                if k.lower() == dk.lower():
                    data[k] = dv.upper() if k.isupper() else dv.title() if k.istitle() else dv
                    break

with open('public/locales/uz/translation.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Dictionary applied!")
