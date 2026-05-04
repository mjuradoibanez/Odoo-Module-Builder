from odoo import models, fields, api, exceptions

class Default(models.Model):
    _name = 'prueba_defecto.default'
    _description = 'default'
    _rec_name = 'txt'

    txt = fields.Char(required=True, default='Probando texto')
    int = fields.Integer(default=23)
    dec = fields.Float(default=3.14)
    bool = fields.Boolean(default=True)
    fecha = fields.Date(default='2026-05-08')

