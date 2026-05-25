import type { ProcessAnalysis } from '../types/processAnalysis';

// Mock endpoint logic to emulate LLM behavior
export const analyzeProcessText = async (text: string, mode: 'create' | 'modify' | 'validate'): Promise<ProcessAnalysis> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (mode === 'create') {
    if (text.toLowerCase().includes('оставляет заявку')) {
      return {
        processTitle: "Обработка заказа клиента",
        processDescription: "Процесс обработки клиентского заказа от получения заявки до доставки или отмены.",
        language: "ru",
        roles: [
          { id: "role_client", name: "Клиент" },
          { id: "role_manager", name: "Менеджер" },
          { id: "role_accounting", name: "Бухгалтерия" },
          { id: "role_warehouse", name: "Склад" },
          { id: "role_courier", name: "Курьер" }
        ],
        nodes: [
          { id: "start_1", type: "startEvent", name: "Заявка получена", roleId: "role_client" },
          { id: "task_1", type: "task", name: "Проверить наличие товара", roleId: "role_manager" },
          { id: "gateway_1", type: "exclusiveGateway", name: "Товар есть?", roleId: "role_manager" },
          { id: "task_2", type: "task", name: "Выставить счет", roleId: "role_manager" },
          { id: "task_3", type: "task", name: "Проверить оплату", roleId: "role_accounting" },
          { id: "task_4", type: "task", name: "Собрать заказ", roleId: "role_warehouse" },
          { id: "task_5", type: "task", name: "Доставить заказ", roleId: "role_courier" },
          { id: "end_1", type: "endEvent", name: "Заказ доставлен", roleId: "role_client" },
          { id: "task_6", type: "task", name: "Предложить замену", roleId: "role_manager" },
          { id: "gateway_2", type: "exclusiveGateway", name: "Клиент согласен?", roleId: "role_manager" },
          { id: "end_2", type: "endEvent", name: "Заказ отменен", roleId: "role_client" }
        ],
        flows: [
          { id: "flow_1", sourceId: "start_1", targetId: "task_1" },
          { id: "flow_2", sourceId: "task_1", targetId: "gateway_1" },
          { id: "flow_3", sourceId: "gateway_1", targetId: "task_2", condition: "Да" },
          { id: "flow_4", sourceId: "task_2", targetId: "task_3" },
          { id: "flow_5", sourceId: "task_3", targetId: "task_4" },
          { id: "flow_6", sourceId: "task_4", targetId: "task_5" },
          { id: "flow_7", sourceId: "task_5", targetId: "end_1" },
          { id: "flow_8", sourceId: "gateway_1", targetId: "task_6", condition: "Нет" },
          { id: "flow_9", sourceId: "task_6", targetId: "gateway_2" },
          { id: "flow_10", sourceId: "gateway_2", targetId: "task_2", condition: "Да" },
          { id: "flow_11", sourceId: "gateway_2", targetId: "end_2", condition: "Нет" }
        ],
        questions: [],
        warnings: ["Не указан сценарий, если клиент оплатил не вовремя."],
        suggestions: []
      };
    } else if (text.length < 50) {
      return {
        processTitle: "Черновик процесса",
        processDescription: "Описание процесса неполное, требуется уточнение.",
        language: "ru",
        roles: [],
        nodes: [],
        flows: [],
        questions: [
          "Что именно происходит на первом шаге?",
          "Кто является основными участниками процесса?",
          "Что является финальным событием?"
        ],
        warnings: ["Описание слишком общее для построения корректной BPMN-схемы."],
        suggestions: []
      };
    } else {
      // Generic simple process
      return {
        processTitle: "Сгенерированный процесс",
        processDescription: "Сгенерировано по описанию.",
        language: "ru",
        roles: [
          { id: "role_system", name: "Система" }
        ],
        nodes: [
          { id: "start_1", type: "startEvent", name: "Начало", roleId: "role_system" },
          { id: "task_1", type: "task", name: "Выполнить шаги", roleId: "role_system" },
          { id: "end_1", type: "endEvent", name: "Конец", roleId: "role_system" }
        ],
        flows: [
          { id: "flow_1", sourceId: "start_1", targetId: "task_1" },
          { id: "flow_2", sourceId: "task_1", targetId: "end_1" }
        ],
        questions: [],
        warnings: [],
        suggestions: []
      }
    }
  }

  if (mode === 'validate') {
    return {
      processTitle: "Результат проверки",
      processDescription: "Анализ текущей BPMN диаграммы",
      language: "ru",
      roles: [],
      nodes: [],
      flows: [],
      questions: [],
      warnings: [
        "Обнаружена задача без исходящего потока (Dead end).",
        "Эксклюзивный шлюз имеет ветку без описания условия (Condition).",
        "Процесс не имеет явно выраженного завершающего события (End Event) в альтернативном сценарии."
      ],
      suggestions: [
        "Добавьте End Event ко всем незавершенным веткам для корректной симуляции.",
        "Подпишите связи, выходящие из шлюзов ('Да' / 'Нет').",
        "Рассмотрите возможность использования пулов (Pools/Lanes) для явного разделения зон ответственности."
      ]
    };
  }

  throw new Error("Mode not implemented in mock");
};
