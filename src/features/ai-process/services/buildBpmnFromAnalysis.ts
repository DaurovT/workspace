import type { ProcessAnalysis } from '../types/processAnalysis';

export const buildBpmnFromAnalysis = (modeler: any, analysis: ProcessAnalysis) => {
  const canvas = modeler.get('canvas');
  const elementFactory = modeler.get('elementFactory');
  const modeling = modeler.get('modeling');

  // Clear existing
  const rootElement = canvas.getRootElement();
  const children = rootElement.children ? [...rootElement.children] : [];
  if (children.length > 0) {
    modeling.removeElements(children);
  }

  // Create lanes/participants if there are roles
  let root = rootElement;

  if (analysis.roles && analysis.roles.length > 0) {
    // Actually, creating a collaboration with participants and lanes is a bit complex in bpmn-js API.
    // For MVP, we will just use a single process and place elements visually based on roles (implicit lanes).
    // Let's create visual "pools/lanes" by grouping y-coordinates.
  }

  // Calculate layout
  const START_Y = 150;
  const LANE_HEIGHT = 160;

  // Map roles to Y offsets
  const roleYMap: Record<string, number> = {};
  if (analysis.roles.length > 0) {
    analysis.roles.forEach((r, idx) => {
      roleYMap[r.id] = START_Y + idx * LANE_HEIGHT;
    });
  }

  const idToShape: Record<string, any> = {};

  // First pass: create all nodes
  // Simple layout: space them out horizontally
  let x = 150;
  
  analysis.nodes.forEach(node => {
    let bpmnType = 'bpmn:Task';
    let width = 100;
    let height = 80;

    switch (node.type) {
      case 'startEvent': bpmnType = 'bpmn:StartEvent'; width = 36; height = 36; break;
      case 'endEvent': bpmnType = 'bpmn:EndEvent'; width = 36; height = 36; break;
      case 'exclusiveGateway': bpmnType = 'bpmn:ExclusiveGateway'; width = 50; height = 50; break;
      case 'parallelGateway': bpmnType = 'bpmn:ParallelGateway'; width = 50; height = 50; break;
      case 'userTask': bpmnType = 'bpmn:UserTask'; break;
      case 'serviceTask': bpmnType = 'bpmn:ServiceTask'; break;
    }

    const y = (node.roleId && roleYMap[node.roleId]) ? roleYMap[node.roleId] : START_Y;

    const shape = elementFactory.createShape({
      type: bpmnType,
      id: node.id
    });

    modeling.createShape(shape, { x: x + width/2, y: y + height/2 }, root);
    modeling.updateProperties(shape, { name: node.name });

    idToShape[node.id] = shape;
    
    // Increment X to lay out horizontally
    x += width + 100;
  });

  // Second pass: create flows
  analysis.flows.forEach(flow => {
    const source = idToShape[flow.sourceId];
    const target = idToShape[flow.targetId];

    if (source && target) {
      const connection = elementFactory.createConnection({
        type: 'bpmn:SequenceFlow',
        id: flow.id
      });
      modeling.createConnection(source, target, connection, root);
      if (flow.condition) {
        modeling.updateProperties(connection, { name: flow.condition });
      }
    }
  });

  // Center view
  canvas.zoom('fit-viewport');
};
