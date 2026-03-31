// Biblioteca de iconos con react-native-vector-icons para categorías de módulos Odoo

export const moduleCategoryIcons: Record<string, { icon: string; color: string; }> = {
  educacion: { icon: 'school-outline', color: '#714B67' }, // Odoo purple
  ventas: { icon: 'cart-outline', color: '#FFB84D' },
  rrhh: { icon: 'people-outline', color: '#A084A2' },
  inventario: { icon: 'cube-outline', color: '#222' },
  finanzas: { icon: 'bar-chart-outline', color: '#4CAF50' },
  marketing: { icon: 'megaphone-outline', color: '#2196F3' },
  otros: { icon: '', color: '#A084A2' }, // Usar inicial si icon vacío
};