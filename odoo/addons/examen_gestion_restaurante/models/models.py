from odoo import models, fields, api
from odoo.exceptions import ValidationError
from datetime import timedelta

class Camarero(models.Model):
    _name = 'examen_gestion_restaurante.camarero'
    _description = 'Camarero'
    _rec_name = 'user_id'

    user_id = fields.Many2one('res.users', string='Usuario', required=True)
    pedidos_ids = fields.One2many('examen_gestion_restaurante.pedido', 'camarero_id', string='Pedidos Asignados')
    total_pedidos = fields.Integer(string='Total de Pedidos', compute='_compute_total_pedidos')
    @api.depends('pedidos_ids')
    def _compute_total_pedidos(self):
        for record in self:
            record.total_pedidos = len(record.pedidos_ids)


class Pedido(models.Model):
    _name = 'examen_gestion_restaurante.pedido'
    _description = 'Pedido'
    _rec_name = 'mesa_id'

    mesa_id = fields.Many2one('examen_gestion_restaurante.mesa', string='Mesa', required=True)
    cliente_id = fields.Many2one('res.partner', string='Cliente', required=True)
    platos_id = fields.Many2one('examen_gestion_restaurante.plato', string='Platos')
    estado = fields.Selection([
        ('pendiente', 'Pendiente'),
        ('preparacion', 'Preparacion'),
        ('servido', 'Servido'),
        ('cancelado', 'Cancelado'),
    ], string='Estado', default='pendiente')
    tiempo_pedido = fields.Datetime(string='Tiempo del Pedido', default=lambda self: fields.Datetime.now())
    camarero_id = fields.Many2one('examen_gestion_restaurante.camarero', string='Camarero', required=True)

class Mesa(models.Model):
    _name = 'examen_gestion_restaurante.mesa'
    _description = 'Mesa'
    _rec_name = 'numero'

    numero = fields.Integer(string='Numero de Mesa', required=True)
    capacidad = fields.Integer(string='Capacidad', required=True)
    descripcion = fields.Char(string='Descripcion')
    estado = fields.Selection([
        ('disponible', 'Disponible'),
        ('ocupada', 'Ocupada'),
        ('reservada', 'Reservada'),
    ], string='Estado', default='disponible')

class Plato(models.Model):
    _name = 'examen_gestion_restaurante.plato'
    _description = 'Plato'
    _rec_name = 'proveedor_id'

    proveedor_id = fields.Many2one('res.partner', string='Proveedor')
    nombre = fields.Char(string='Nombre', required=True)
    categoria = fields.Selection([
        ('salado', 'Salado'),
        ('dulce', 'Dulce'),
    ], string='Categoria', default='salado')
    precio = fields.Integer(string='Precio', required=True)
    descripcion = fields.Char(string='Descripcion')

