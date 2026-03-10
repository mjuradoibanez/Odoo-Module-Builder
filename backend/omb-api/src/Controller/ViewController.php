<?php

namespace App\Controller;

use App\Entity\Models;
use App\Entity\Views;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;

class ViewController extends AbstractController
{
    public function views(Request $request, SerializerInterface $serializer)
    {
        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $views = $entityManager
                ->getRepository(Views::class)
                ->findAll();

            if (!$views) {
                return new Response("Views not found", 400);
            }

            $data = $serializer->serialize($views, 'json', ['groups' => 'views:read']);

            return new Response($data, 200, ['Content-Type' => 'application/json']);

        } else if ($request->isMethod('POST')) {
            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new Response("Invalid JSON", 400);
            }

            if (
                empty($data['type']) ||
                empty($data['model_id'])
            ) {
                return new Response("Missing required fields", 400);
            }

            // Verificar duplicados
            $existing = $entityManager
                ->getRepository(Views::class)
                ->findOneBy([
                    'type' => $data['type'],
                    'model' => $data['model_id']
                ]);

            if ($existing) {
                return new Response("View type already exists in this model", 409);
            }

            $model = $entityManager
                ->getRepository(Models::class)
                ->findOneBy(['id' => $data['model_id']]);

            if (!$model) {
                return new Response("Model not found", 404);
            }

            $view = new Views();
            $view->setType($data['type']);
            $view->setName($data['name'] ?? null);
            $view->setModel($model);

            $entityManager->persist($view);
            $entityManager->flush();

            $json = $serializer->serialize($view, 'json', ['groups' => 'views:read']);

            return new Response($json, 201, ['Content-Type' => 'application/json']);
        }

        return new Response("Method not allowed", 405);
    }

    public function view(Request $request, SerializerInterface $serializer)
    {
        $id = $request->get('id');

        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $view = $entityManager
                ->getRepository(Views::class)
                ->findOneBy(['id' => $id]);

            if (!$view) {
                return new Response("View not found", 404);
            }

            $data = $serializer->serialize($view, 'json', ['groups' => 'views:read']);

            return new Response($data, 200, ['Content-Type' => 'application/json']);

        } else if ($request->isMethod('DELETE')) {
            $view = $entityManager
                ->getRepository(Views::class)
                ->findOneBy(['id' => $id]);

            if (!$view) {
                return new Response("View not found", 404);
            }

            $entityManager->remove($view);
            $entityManager->flush();

            return new Response("View deleted", 204);

        } else if ($request->isMethod('PUT')) {
            $view = $entityManager
                ->getRepository(Views::class)
                ->findOneBy(['id' => $id]);

            if (!$view) {
                return new Response("View not found", 404);
            }

            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new Response("Invalid JSON", 400);
            }

            // Verificar duplicados
            if (isset($data['type'])) {
                $existing = $entityManager
                    ->getRepository(Views::class)
                    ->findOneBy([
                        'type' => $data['type'],
                        'model' => $view->getModel()->getId()
                    ]);

                if ($existing && $existing->getId() != $view->getId()) {
                    return new Response("View type already exists in this model", 409);
                }
            }

            $serializer->deserialize(
                json_encode($data),
                Views::class,
                'json',
                ['object_to_populate' => $view]
            );

            if (isset($data['model_id'])) {
                $model = $entityManager
                    ->getRepository(Models::class)
                    ->findOneBy(['id' => $data['model_id']]);

                if (!$model) {
                    return new Response("Model not found", 404);
                }

                $view->setModel($model);
            }

            $entityManager->flush();

            $json = $serializer->serialize($view, 'json', ['groups' => 'views:read']);

            return new Response($json, 200, ['Content-Type' => 'application/json']);
        }

        return new Response("Method not allowed", 405);
    }
}