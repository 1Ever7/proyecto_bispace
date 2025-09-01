export const formatListResponse = (data: any, entityType: string): string => {
  if (!data) return `No se encontraron datos de ${entityType}.`;
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `No se encontraron ${entityType}s.`;
    }
    
    return `Encontrados ${data.length} ${entityType}s:\n${JSON.stringify(data, null, 2)}`;
  }
  
  return JSON.stringify(data, null, 2);
};

export const formatCountResponse = (data: any, entityType: string): string => {
  if (typeof data === 'number') {
    return `Cantidad de ${entityType}: ${data}`;
  }
  
  if (data && typeof data === 'object' && data.count !== undefined) {
    return `Cantidad de ${entityType}: ${data.count}`;
  }
  
  return `Datos de cantidad para ${entityType}: ${JSON.stringify(data, null, 2)}`;
};

export const formatAPIResponse = (data: any, formatterType?: string): string => {
  if (!formatterType) return JSON.stringify(data);
  
  switch (formatterType) {
    case 'list':
      return formatListResponse(data, 'elementos');
    case 'count':
      return formatCountResponse(data, 'elementos');
    default:
      return JSON.stringify(data, null, 2);
  }
};