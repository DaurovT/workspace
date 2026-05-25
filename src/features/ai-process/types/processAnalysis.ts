export type ProcessNodeType =
  | "startEvent"
  | "endEvent"
  | "task"
  | "userTask"
  | "serviceTask"
  | "exclusiveGateway"
  | "parallelGateway"
  | "intermediateCatchEvent"
  | "intermediateThrowEvent"
  | "dataObject";

export type ProcessRole = {
  id: string;
  name: string;
};

export type ProcessNode = {
  id: string;
  type: ProcessNodeType;
  name: string;
  roleId?: string | null;
  description?: string | null;
  sla?: string | null;
};

export type ProcessFlow = {
  id: string;
  sourceId: string;
  targetId: string;
  condition?: string | null;
};

export type ProcessAnalysis = {
  processTitle: string;
  processDescription: string;
  language: string;
  roles: ProcessRole[];
  nodes: ProcessNode[];
  flows: ProcessFlow[];
  questions: string[];
  warnings: string[];
  suggestions: string[];
};

export type DiagramOperation =
  | { type: "addNode"; node: ProcessNode }
  | { type: "updateNode"; nodeId: string; patch: Partial<ProcessNode> }
  | { type: "removeNode"; nodeId: string }
  | { type: "addFlow"; flow: ProcessFlow }
  | { type: "updateFlow"; flowId: string; patch: Partial<ProcessFlow> }
  | { type: "removeFlow"; flowId: string }
  | { type: "addRole"; role: ProcessRole }
  | { type: "updateRole"; roleId: string; patch: Partial<ProcessRole> }
  | { type: "removeRole"; roleId: string };
