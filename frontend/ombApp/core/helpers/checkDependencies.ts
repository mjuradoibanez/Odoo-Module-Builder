// Comprobar dependencias de módulos o modelos

export function checkDependencies(allModules: any[], target: { type: 'module'|'model', id: number, technicalName: string, userId?: number, models?: any[], modelTechnicalName?: string }) {
  const blockList: any[] = [];
  let circularIds: [number, number] | null = null;

  // Comprobamos si algún campo de OTRO módulo apunta a cualquiera de sus modelos
  for (const module of allModules) {
    // Saltar el propio módulo
    if (module.id === target.id) continue;
    if (!module.models) continue;

    // Solo revisar módulos del mismo usuario
    if (target.userId !== undefined && module.user?.id !== target.userId) continue;

    for (const model of module.models) {
      if (!model.fields) continue;
      for (const field of model.fields) {
        // Relación a modelo: formato 'modulo.technicalName.modelo.technicalName'
        if (
          (field.type === 'relation' || field.type === 'many2one' || field.type === 'many2many' || field.type === 'one2many' || field.type === 'one2one') &&
          field.relationModel
        ) {
          if (target.type === 'module' && target.models) {
            // Apunta a algún modelo de este módulo?
            for (const m of target.models) {
              if (`${target.technicalName}.${m.technicalName}` === field.relationModel) {
                blockList.push({
                  moduleId: module.id,
                  moduleName: module.name,
                  modelName: model.name,
                  modelTechnicalName: model.technicalName,
                  fieldName: field.name,
                  fieldTechnicalName: field.technicalName,
                  fieldType: field.type,
                });
              }
            }
          } else if (target.type === 'model' && target.modelTechnicalName) {
            // Apunta a este modelo concreto?
            if (field.relationModel === `${target.technicalName}.${target.modelTechnicalName}`) {
              blockList.push({
                moduleId: module.id,
                moduleName: module.name,
                modelName: model.name,
                modelTechnicalName: model.technicalName,
                fieldName: field.name,
                fieldTechnicalName: field.technicalName,
                fieldType: field.type,
              });
            }
          }
        }
      }
    }
  }
  return { blockList, circularIds };
}
