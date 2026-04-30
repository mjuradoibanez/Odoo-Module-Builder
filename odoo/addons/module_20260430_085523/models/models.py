from odoo import models, fields, api, exceptions

class Tareas(models.Model):
    _name = 'lista_tareas.tareas'
    _description = 'tareas'
    nombre = fields.Char(required=True)
    fecha = fields.Date()
    completada = fields.Boolean()

