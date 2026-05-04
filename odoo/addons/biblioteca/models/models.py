from odoo import models, fields, api, exceptions

class Libro(models.Model):
    _name = 'biblioteca.libro'
    _description = 'libro'
    _rec_name = 'titulo'

    titulo = fields.Char(required=True)
    isbn = fields.Char()
    fecha_publicacion = fields.Date()
    autor_id = fields.Many2one('biblioteca.autor')
    categoria_id = fields.Many2one('biblioteca.categoria')
    disponible = fields.Boolean()
    @api.constrains('titulo')
    def _check_unique_titulo(self):
        for record in self:
            domain = [('titulo', '=', record.titulo), ('id', '!=', record.id)]
            count = self.search_count(domain)
            if count > 0:
                raise exceptions.ValidationError('¡Error! Ya existe un registro con el valor único en titulo')

    @api.constrains('isbn')
    def _check_unique_isbn(self):
        for record in self:
            domain = [('isbn', '=', record.isbn), ('id', '!=', record.id)]
            count = self.search_count(domain)
            if count > 0:
                raise exceptions.ValidationError('¡Error! Ya existe un registro con el valor único en isbn')


class Autor(models.Model):
    _name = 'biblioteca.autor'
    _description = 'autor'
    _rec_name = 'nombre'

    nombre = fields.Char(required=True)
    fecha_nacimiento = fields.Date()
    nacionalidad = fields.Char()
    @api.constrains('nombre')
    def _check_unique_nombre(self):
        for record in self:
            domain = [('nombre', '=', record.nombre), ('id', '!=', record.id)]
            count = self.search_count(domain)
            if count > 0:
                raise exceptions.ValidationError('¡Error! Ya existe un registro con el valor único en nombre')


class Categoria(models.Model):
    _name = 'biblioteca.categoria'
    _description = 'categoria'
    _rec_name = 'nombre'

    nombre = fields.Char(required=True)
    descripcion = fields.Char()
    @api.constrains('nombre')
    def _check_unique_nombre(self):
        for record in self:
            domain = [('nombre', '=', record.nombre), ('id', '!=', record.id)]
            count = self.search_count(domain)
            if count > 0:
                raise exceptions.ValidationError('¡Error! Ya existe un registro con el valor único en nombre')


class Prestamo(models.Model):
    _name = 'biblioteca.prestamo'
    _description = 'prestamo'
    _rec_name = 'libro_id'

    libro_id = fields.Many2one('biblioteca.libro')
    usuario = fields.Many2one('res.users')
    fecha_inicio = fields.Date(required=True)
    fecha_fin = fields.Date()
    devuelto = fields.Boolean()

