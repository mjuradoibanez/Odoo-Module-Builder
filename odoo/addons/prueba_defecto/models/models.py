from odoo import models, fields, api, exceptions

class Default(models.Model):
    _name = 'prueba_defecto.default'
    _description = 'default'
    _rec_name = 'txt'

    txt = fields.Char(string='txt', required=True, default='Probando texto')
    int = fields.Integer(string='int', default=23)
    dec = fields.Float(string='dec', default=3.14)
    bool = fields.Boolean(string='bool', default=True)
    fecha = fields.Date(string='fecha', default='2026-05-08')
    select = fields.Selection([
        ('0', 'Bajo'),
        ('2', 'Alto'),
        ('1', 'Medio'),
    ], string='select', default='2')

