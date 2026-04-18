from odoo import models, fields, api

class Alumno(models.Model):
    _name = 'academia.alumno'
    _description = 'Alumno'
    nombre = fields.Char()
    edad = fields.Integer()

class Curso(models.Model):
    _name = 'academia.curso'
    _description = 'Curso'
    titulo = fields.Char()
    descripcion = fields.Text()

