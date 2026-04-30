from odoo import models, fields, api, exceptions

class Generador(models.Model):
    _name = 'otrosmod.generador'
    _description = 'generador'
    probando = fields.Char()
    asd = fields.Many2one('res.users')
    cal = fields.Many2one('calendar.event')

