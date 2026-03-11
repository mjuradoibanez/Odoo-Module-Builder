<?php

/**
 * This file has been auto-generated
 * by the Symfony Routing Component.
 */

return [
    false, // $matchHost
    [ // $staticRoutes
        '/_profiler' => [[['_route' => '_profiler_home', '_controller' => 'web_profiler.controller.profiler::homeAction'], null, null, null, true, false, null]],
        '/_profiler/search' => [[['_route' => '_profiler_search', '_controller' => 'web_profiler.controller.profiler::searchAction'], null, null, null, false, false, null]],
        '/_profiler/search_bar' => [[['_route' => '_profiler_search_bar', '_controller' => 'web_profiler.controller.profiler::searchBarAction'], null, null, null, false, false, null]],
        '/_profiler/phpinfo' => [[['_route' => '_profiler_phpinfo', '_controller' => 'web_profiler.controller.profiler::phpinfoAction'], null, null, null, false, false, null]],
        '/_profiler/open' => [[['_route' => '_profiler_open_file', '_controller' => 'web_profiler.controller.profiler::openAction'], null, null, null, false, false, null]],
        '/modules' => [[['_route' => 'modules', '_controller' => 'App\\Controller\\ModuleController::modules'], null, ['GET' => 0, 'POST' => 1], null, false, false, null]],
        '/models' => [[['_route' => 'models', '_controller' => 'App\\Controller\\ModelController::models'], null, ['GET' => 0, 'POST' => 1], null, false, false, null]],
        '/fields' => [[['_route' => 'fields', '_controller' => 'App\\Controller\\FieldController::fields'], null, ['GET' => 0, 'POST' => 1], null, false, false, null]],
        '/users' => [[['_route' => 'users', '_controller' => 'App\\Controller\\UserController::users'], null, ['GET' => 0, 'POST' => 1], null, false, false, null]],
        '/views' => [[['_route' => 'views', '_controller' => 'App\\Controller\\ViewController::views'], null, ['GET' => 0, 'POST' => 1], null, false, false, null]],
        '/viewFields' => [[['_route' => 'viewFields', '_controller' => 'App\\Controller\\ViewFieldController::viewFields'], null, ['GET' => 0, 'POST' => 1], null, false, false, null]],
        '/deployments' => [[['_route' => 'deployments', '_controller' => 'App\\Controller\\DeploymentController::deployments'], null, ['GET' => 0, 'POST' => 1], null, false, false, null]],
        '/login' => [[['_route' => 'login', '_controller' => 'App\\Controller\\UserController::login'], null, ['POST' => 0], null, false, false, null]],
    ],
    [ // $regexpList
        0 => '{^(?'
                .'|/_(?'
                    .'|error/(\\d+)(?:\\.([^/]++))?(*:38)'
                    .'|wdt/([^/]++)(*:57)'
                    .'|profiler/([^/]++)(?'
                        .'|/(?'
                            .'|search/results(*:102)'
                            .'|router(*:116)'
                            .'|exception(?'
                                .'|(*:136)'
                                .'|\\.css(*:149)'
                            .')'
                        .')'
                        .'|(*:159)'
                    .')'
                .')'
                .'|/mod(?'
                    .'|ules/([^/]++)(*:189)'
                    .'|els/([^/]++)(*:209)'
                .')'
                .'|/fields/([^/]++)(*:234)'
                .'|/users/([^/]++)(*:257)'
                .'|/view(?'
                    .'|s/([^/]++)(*:283)'
                    .'|Fields/([^/]++)(*:306)'
                .')'
                .'|/deployments/([^/]++)(*:336)'
            .')/?$}sD',
    ],
    [ // $dynamicRoutes
        38 => [[['_route' => '_preview_error', '_controller' => 'error_controller::preview', '_format' => 'html'], ['code', '_format'], null, null, false, true, null]],
        57 => [[['_route' => '_wdt', '_controller' => 'web_profiler.controller.profiler::toolbarAction'], ['token'], null, null, false, true, null]],
        102 => [[['_route' => '_profiler_search_results', '_controller' => 'web_profiler.controller.profiler::searchResultsAction'], ['token'], null, null, false, false, null]],
        116 => [[['_route' => '_profiler_router', '_controller' => 'web_profiler.controller.router::panelAction'], ['token'], null, null, false, false, null]],
        136 => [[['_route' => '_profiler_exception', '_controller' => 'web_profiler.controller.exception_panel::body'], ['token'], null, null, false, false, null]],
        149 => [[['_route' => '_profiler_exception_css', '_controller' => 'web_profiler.controller.exception_panel::stylesheet'], ['token'], null, null, false, false, null]],
        159 => [[['_route' => '_profiler', '_controller' => 'web_profiler.controller.profiler::panelAction'], ['token'], null, null, false, true, null]],
        189 => [[['_route' => 'module', '_controller' => 'App\\Controller\\ModuleController::module'], ['id'], ['GET' => 0, 'DELETE' => 1, 'PUT' => 2], null, false, true, null]],
        209 => [[['_route' => 'model', '_controller' => 'App\\Controller\\ModelController::model'], ['id'], ['GET' => 0, 'DELETE' => 1, 'PUT' => 2], null, false, true, null]],
        234 => [[['_route' => 'field', '_controller' => 'App\\Controller\\FieldController::field'], ['id'], ['GET' => 0, 'DELETE' => 1, 'PUT' => 2], null, false, true, null]],
        257 => [[['_route' => 'user', '_controller' => 'App\\Controller\\UserController::user'], ['id'], ['GET' => 0, 'DELETE' => 1, 'PUT' => 2], null, false, true, null]],
        283 => [[['_route' => 'view', '_controller' => 'App\\Controller\\ViewController::view'], ['id'], ['GET' => 0, 'DELETE' => 1, 'PUT' => 2], null, false, true, null]],
        306 => [[['_route' => 'viewField', '_controller' => 'App\\Controller\\ViewFieldController::viewField'], ['id'], ['DELETE' => 0], null, false, true, null]],
        336 => [
            [['_route' => 'deployment', '_controller' => 'App\\Controller\\DeploymentController::deployment'], ['id'], ['GET' => 0, 'DELETE' => 1], null, false, true, null],
            [null, null, null, null, false, false, 0],
        ],
    ],
    null, // $checkCondition
];
