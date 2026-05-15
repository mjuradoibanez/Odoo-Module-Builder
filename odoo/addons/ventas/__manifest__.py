{
    'name': 'Ventas',
    'version': '1.0',
    'author': 'Usuario',
    'category': 'ventas',
    'description': 'Gestión de clientes, pedidos y facturación.',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/views.xml'
    ],
    'installable': True,
    'application': True
}