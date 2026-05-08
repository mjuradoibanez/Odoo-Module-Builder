from odoo import models, fields, api
from odoo.exceptions import ValidationError
from datetime import timedelta

class Libro(models.Model):
    _name = 'biblioteca.libro'
    _description = 'libro'
    _rec_name = 'titulo'

    titulo = fields.Char(string='titulo', required=True)
    autor = fields.Char(string='autor')

