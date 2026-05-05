from odoo import models, fields, api
from odoo.exceptions import ValidationError
from datetime import timedelta

class Comprobando(models.Model):
    _name = 'gestion_restaurante.comprobando'
    _description = 'comprobando'
    _rec_name = 'nombre'

    nombre = fields.Char(string='nombre', required=True, default='Rigoberta')
    edad = fields.Integer(string='edad', required=True, default=20)
    fecha_nacimiento = fields.Date(string='fecha nacimiento')
    animal_favorito = fields.Selection([
        ('perro', 'perro'),
        ('gato', 'gato'),
    ], string='animal favorito', default='perro')
    @api.constrains('animal_favorito', 'fecha_nacimiento', 'nombre', 'edad')
    def _check_business_rules(self):
        for record in self:
            # Regla: Longitud mínima sobre nombre
            if record.nombre is not False:
                if len(record.nombre) < 10:
                    raise ValidationError('¡Error! nombre debe tener al menos 10 caracteres')
            # Regla: No permitir fechas futuras sobre fecha nacimiento
            if record.fecha_nacimiento is not False:
                if record.fecha_nacimiento > fields.Date.today():
                    raise ValidationError('¡Error! fecha nacimiento no puede ser una fecha futura')

    @api.onchange('edad')
    def _onchange_warnings_edad(self):
        if not self.edad:
            return
        if self.edad > 80:
            return {
                'warning': {'title': 'Aviso de Valor', 'message': '¡Aviso! edad: el valor es superior a 80', 'type': 'notification'}
            }

    @api.onchange('animal_favorito')
    def _onchange_warnings_animal_favorito(self):
        if not self.animal_favorito:
            return
        if self.animal_favorito == 'gato':
            return {
                'warning': {'title': 'Notificación', 'message': 'Has seleccionado una opción marcada con aviso', 'type': 'notification'}
            }


