from odoo import models, fields, api
from odoo.exceptions import ValidationError
from datetime import timedelta

class Camarero(models.Model):
    _name = 'sg_restaurante.camarero'
    _description = 'Camarero'
    _rec_name = 'user_id'

    user_id = fields.Many2one('res.users', string='Usuario', required=True)
    pedidos_id = fields.One2many('sg_restaurante.pedido', 'camarero_id', string='Pedidos')
    total_pedidos = fields.Integer(string='Total Pedidos', compute='_compute_total_pedidos', store=True, group_operator='sum')
    @api.depends('pedidos_id')
    def _compute_total_pedidos(self):
        for record in self:
            record.total_pedidos = len(record.pedidos_id)


class Pedido(models.Model):
    _name = 'sg_restaurante.pedido'
    _description = 'Pedido'
    _rec_name = 'mesa_id'

    mesa_id = fields.Many2one('sg_restaurante.mesa', string='Mesa', required=True)
    cliente_id = fields.Many2one('res.partner', string='Cliente', required=True)
    platos_id = fields.Many2many('sg_restaurante.plato', string='Platos')
    estado = fields.Selection([
        ('pendiente', 'Pendiente'),
        ('preparacion', 'Preparacion'),
        ('servido', 'Servido'),
        ('cancelado', 'Cancelado'),
        ('pagado', 'Pagado'),
    ], string='Estado', default='pendiente')
    tiempo_pedido = fields.Datetime(string='Tiempo Pedido', default=lambda self: fields.Datetime.now())
    camarero_id = fields.Many2one('sg_restaurante.camarero', string='Camarero', required=True)
    @api.onchange('estado')
    def _onchange_warnings_estado(self):
        if not self.estado:
            return
        if self.estado == 'servido':
            return {
                'warning': {'title': 'Notificación', 'message': 'Has seleccionado una opción marcada con aviso', 'type': 'notification'}
            }


class Mesa(models.Model):
    _name = 'sg_restaurante.mesa'
    _description = 'Mesa'
    _rec_name = 'numero'

    numero = fields.Integer(string='Numero', required=True)
    descripcion = fields.Char(string='Descripcion')
    capacidad = fields.Integer(string='Capacidad', required=True)
    estado = fields.Selection([
        ('disponible', 'Disponible'),
        ('ocupado', 'Ocupado'),
        ('reservada', 'Reservada'),
    ], string='Estado', required=True, default='disponible')
    ubicacion = fields.Selection([
        ('salon', 'Salon'),
        ('terraza', 'Terraza'),
        ('barra', 'Barra'),
    ], string='Ubicacion')
    @api.constrains('capacidad')
    def _check_business_rules(self):
        for record in self:
            # Regla: Valor mínimo sobre Capacidad
            if record.capacidad is not False:
                if record.capacidad < 1:
                    raise ValidationError('¡Error! Capacidad no puede ser menor que 1')


class Plato(models.Model):
    _name = 'sg_restaurante.plato'
    _description = 'Plato'
    _rec_name = 'nombre'

    nombre = fields.Char(string='Nombre', required=True)
    categoria = fields.Selection([
        ('entrada', 'Entrada'),
        ('principal', 'Principal'),
        ('postre', 'Postre'),
        ('bebida', 'Bebida'),
    ], string='Categoria')
    precio = fields.Float(string='Precio', required=True)
    descripcion = fields.Char(string='Descripcion')
    proveedor_id = fields.Many2one('res.partner', string='Proveedor')
    @api.constrains('precio')
    def _check_business_rules(self):
        for record in self:
            # Regla: Valor mínimo sobre Precio
            if record.precio is not False:
                if record.precio < 0.1:
                    raise ValidationError('¡Error! Precio no puede ser menor que 0.1')


