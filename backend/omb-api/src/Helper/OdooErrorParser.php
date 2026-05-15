<?php

namespace App\Helper;

// Analiza mensajes de error de Odoo y devuelve mensajes más amigables detectando patrones comunes
class OdooErrorParser
{
    // Patrones de error con sus mensajes descriptivos
    private const PATTERNS = [
        // Errores de sintaxis Python
        '/IndentationError:.*/' => 'Error de indentación en Python. Revisa que el código generado tenga la indentación correcta (espacios vs tabs).',
        '/SyntaxError:.*/' => 'Error de sintaxis en Python. Revisa el código generado por posibles errores de sintaxis.',

        // Errores de nombres y atributos
        '/NameError:.*is not defined/' => 'El módulo hace referencia a una variable o clase que no existe. Revisa los nombres de campos y modelos.',
        '/NameError:.*/' => 'Error de nombre: se hace referencia a algo que no está definido.',
        '/AttributeError:.*has no attribute/' => 'El módulo intenta usar un atributo que no existe en Odoo. Revisa los tipos de campo utilizados.',
        '/AttributeError:.*/' => 'Error de atributo: se intenta acceder a algo que no existe.',

        // Errores de importación
        '/ImportError:.*/' => 'Error importando un módulo de Python. Revisa las dependencias en el manifest.',
        '/ModuleNotFoundError:.*/' => 'No se encuentra un módulo de Python necesario. Revisa las dependencias.',

        // Errores de tipos y valores
        '/KeyError:.*/' => 'Error de clave: se intenta acceder a un diccionario con una clave que no existe.',
        '/TypeError:.*/' => 'Error de tipo: se está usando un valor con un tipo incorrecto.',
        '/ValueError:.*/' => 'Error de valor: un valor no es el esperado.',
        '/ZeroDivisionError:.*/' => 'Error matemático: división entre cero.',
        '/IndexError:.*/' => 'Error de índice: se intenta acceder a una posición que no existe en una lista.',

        // Errores de Odoo
        '/ValidationError:.*/' => 'Error de validación en Odoo. Revisa las reglas de constraint del módulo.',
        '/AccessError:.*/' => 'Error de permisos en Odoo. Revisa el archivo de seguridad (ir.model.access.csv).',
        '/IntegrityError:.*/' => 'Error de integridad en la base de datos. Revisa relaciones y campos únicos.',
        '/ProgrammingError:.*/' => 'Error de programación en la base de datos. Revisa la estructura del modelo.',
        '/OperationalError:.*/' => 'Error operacional en la base de datos.',
        '/ParseError:.*/' => 'Error de parseo en XML de vistas. Revisa las vistas del módulo.',

        // Errores específicos de campos generados
        '/fields\.Datetime\.now\(\)/' => 'Error con la función de fecha/hora. Revisa los campos con valor por defecto "Hoy".',
        '/fields\.Date\.today\(\)/' => 'Error con la función de fecha. Revisa los campos con valor por defecto de fecha.',
        '/many2one.*required/' => 'Error en un campo Many2one requerido. Revisa que el campo exista y tenga un modelo relacionado válido.',
        '/one2many.*required/' => 'Error en un campo One2many. Revisa la configuración del campo.',
        '/many2many.*required/' => 'Error en un campo Many2many. Revisa la configuración del campo.',
    ];

    // Analiza un mensaje de error de Odoo y devuelve un mensaje más amigable.   
    public static function parse(string $errorMsg): string
    {
        foreach (self::PATTERNS as $regex => $hint) {
            if (preg_match($regex, $errorMsg)) {
                return $hint;
            }
        }

        return 'Error desconocido al instalar en Odoo. Revisa el log para más detalles.';
    }
}
