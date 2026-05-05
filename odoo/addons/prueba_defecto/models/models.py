from odoo import models, fields, api
from odoo.exceptions import ValidationError
from datetime import timedelta

class Default(models.Model):
    _name = 'prueba_defecto.default'
    _description = 'default'
    _rec_name = 'txt'

    txt = fields.Char(string='txt', required=True, default='Probando texto')
    f_int = fields.Integer(string='int', default=20)
    fec = fields.Date(string='fec')
    bool = fields.Boolean(string='bool', default=True)
    select = fields.Selection([
        ('0', 'Bajo'),
        ('2', 'Alto'),
        ('1', 'Medio'),
    ], string='select', default='0')
    fecha_limite = fields.Date(string='fecha limite')
    @api.constrains('fecha_limite', 'select', 'fec', 'f_int')
    def _check_business_rules(self):
        for record in self:
            # Regla: Anterior al campo sobre fec
            if record.fec is not False:
                if record.fecha_limite and record.fec > record.fecha_limite:
                    raise ValidationError('¡Error! fec debe ser anterior a fecha_limite')

    @api.onchange('f_int')
    def _onchange_warnings_f_int(self):
        if not self.f_int:
            return
        if self.f_int < 15:
            return {
                'warning': {'title': 'Aviso de Valor', 'message': '¡Aviso! int: el valor es inferior a 15', 'type': 'notification'}
            }

    @api.onchange('select')
    def _onchange_warnings_select(self):
        if not self.select:
            return
        if self.select == '2':
            return {
                'warning': {'title': 'Notificación', 'message': 'Has seleccionado una opción marcada con aviso', 'type': 'notification'}
            }

    @api.onchange('fecha_limite')
    def _onchange_warnings_fecha_limite(self):
        if not self.fecha_limite:
            return
        limit_date = fields.Date.today() + timedelta(days=3)
        if self.fecha_limite <= limit_date and self.fecha_limite >= fields.Date.today():
            return {
                'warning': {'title': 'Fecha Próxima', 'message': '¡Aviso! fecha limite: quedan menos de 3 días', 'type': 'notification'}
            }


