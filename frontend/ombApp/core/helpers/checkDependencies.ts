// Comprobar dependencias de módulos o modelos

export function checkDependencies(allModules: any[], target: { type: 'module'|'model', id: number, technicalName: string, models?: any[], modelTechnicalName?: string }) {
  const blockList: any[] = [];
  let circularIds: [number, number] | null = null;

  // Comprobamos si algún campo de otro módulo apunta a cualquiera de sus modelos
  for (const module of allModules) {
    if (!module.models) continue;
    for (const model of module.models) {
      if (!model.fields) continue;
      for (const field of model.fields) {
        // Relación a modelo: formato 'modulo.technicalName.modelo.technicalName'
        if (
          (field.type === 'relation' || field.type === 'many2one' || field.type === 'many2many' || field.type === 'one2many' || field.type === 'one2one') &&
          field.relationModel
        ) {
          if (target.type === 'module' && target.models) {
            // ¿Apunta a algún modelo de este módulo?
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
                // Bloqueo circular: ¿el modelo objetivo también apunta de vuelta?
                if (model.fields.some((f: any) => f.relationModel === `${target.technicalName}.${m.technicalName}`)) {
                  circularIds = [target.id, model.id];
                }
              }
            }
          } else if (target.type === 'model' && target.modelTechnicalName) {
            // ¿Apunta a este modelo concreto?
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
              // Bloqueo circular: ¿el modelo objetivo también apunta de vuelta?
              if (model.fields.some((f: any) => f.relationModel === `${target.technicalName}.${target.modelTechnicalName}`)) {
                circularIds = [target.id, model.id];
              }
            }
          }
        }
      }
    }
  }
  return { blockList, circularIds };
}
