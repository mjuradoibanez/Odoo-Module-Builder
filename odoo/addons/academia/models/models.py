from odoo import models, fields, api, exceptions

class Alumno(models.Model):
    _name = 'academia.alumno'
    _description = 'Alumno'
    nombre = fields.Char(required=True)
    edad = fields.Integer()
    @api.constrains('nombre')
    def _check_unique_nombre(self):
        for record in self:
            domain = [('nombre', '=', record.nombre), ('id', '!=', record.id)]
            count = self.search_count(domain)
            if count > 0:
                raise exceptions.ValidationError('¡Error! Ya existe un registro con el valor único en nombre')


class Curso(models.Model):
    _name = 'academia.curso'
    _description = 'Curso'
    titulo = fields.Char(required=True)
    descripcion = fields.Text()
    @api.constrains('titulo')
    def _check_unique_titulo(self):
        for record in self:
            domain = [('titulo', '=', record.titulo), ('id', '!=', record.id)]
            count = self.search_count(domain)
            if count > 0:
                raise exceptions.ValidationError('¡Error! Ya existe un registro con el valor único en titulo')


