from odoo import models, fields, api
from odoo.exceptions import ValidationError
from datetime import timedelta

class Cliente(models.Model):
    _name = 'ventas.cliente'
    _description = 'Cliente'
    _rec_name = 'nombre'

    nombre = fields.Char(string='Nombre', required=True)
    email = fields.Char(string='Email')
    telefono = fields.Char(string='Teléfono')
    tipo_cliente = fields.Selection([
        ('particular', 'Particular'),
        ('empresa', 'Empresa'),
    ], string='Tipo de cliente', default='particular')
    @api.constrains('email')
    def _check_unique_email(self):
        for record in self:
            domain = [('email', '=', record.email), ('id', '!=', record.id)]
            count = self.search_count(domain)
            if count > 0:
                raise ValidationError('¡Error! Ya existe un registro con el valor único en Email')

    @api.constrains('telefono')
    def _check_business_rules(self):
        for record in self:
            # Regla: Longitud mínima sobre Teléfono
            if record.telefono is not False:
                if len(record.telefono) < 9:
                    raise ValidationError('¡Error! Teléfono debe tener al menos 9 caracteres')


class Pedido(models.Model):
    _name = 'ventas.pedido'
    _description = 'Pedido'
    _rec_name = 'cliente_id'

    cliente_id = fields.Many2one('ventas.cliente', string='Cliente', required=True)
    fecha = fields.Date(string='Fecha', required=True)
    estado = fields.Selection([
        ('pendiente', 'Pendiente'),
        ('confirmado', 'Confirmado'),
        ('enviado', 'Enviado'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ], string='Estado', default='pendiente')
    total = fields.Float(string='Total')
    @api.constrains('fecha', 'total')
    def _check_business_rules(self):
        for record in self:
            # Regla: No permitir fechas futuras sobre Fecha
            if record.fecha is not False:
                if record.fecha > fields.Date.today():
                    raise ValidationError('¡Error! Fecha no puede ser una fecha futura')
            # Regla: Valor mínimo sobre Total
            if record.total is not False:
                if record.total < 0:
                    raise ValidationError('¡Error! Total no puede ser menor que 0')


class LineaPedido(models.Model):
    _name = 'ventas.linea_pedido'
    _description = 'Línea de pedido'
    _rec_name = 'pedido_id'

    pedido_id = fields.Many2one('ventas.pedido', string='Pedido', required=True)
    producto = fields.Char(string='Producto', required=True)
    cantidad = fields.Integer(string='Cantidad', required=True, default=1)
    precio_unitario = fields.Float(string='Precio unitario', required=True)
    @api.constrains('cantidad', 'precio_unitario')
    def _check_business_rules(self):
        for record in self:
            # Regla: Valor mínimo sobre Cantidad
            if record.cantidad is not False:
                if record.cantidad < 1:
                    raise ValidationError('¡Error! Cantidad no puede ser menor que 1')
            # Regla: Valor mínimo sobre Precio unitario
            if record.precio_unitario is not False:
                if record.precio_unitario < 0:
                    raise ValidationError('¡Error! Precio unitario no puede ser menor que 0')


