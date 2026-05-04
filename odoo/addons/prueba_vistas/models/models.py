from odoo import models, fields, api, exceptions

class VistasPersonal(models.Model):
    _name = 'prueba_vistas.vistas_personal'
    _description = 'vistas personal'
    nombre = fields.Char(required=True)
    edad = fields.Integer()
    activo = fields.Boolean()

