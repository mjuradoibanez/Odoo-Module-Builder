<?php

namespace App\Controller;

use App\Entity\Fields;
use App\Entity\ViewFields;
use App\Entity\Views;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;

class ViewFieldController extends AbstractController
{
    public function viewFields(Request $request, SerializerInterface $serializer)
    {
        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $viewFields = $entityManager
                ->getRepository(ViewFields::class)
                ->findAll();

            if (!$viewFields) {
                return new Response("View fields not found", 400);
            }

            $data = $serializer->serialize($viewFields, 'json', ['groups' => 'view_fields:read']);

            return new Response($data, 200, ['Content-Type' => 'application/json']);

        } else if ($request->isMethod('POST')) {
            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new Response("Invalid JSON", 400);
            }

            if (
                empty($data['view_id']) ||
                empty($data['field_id'])
            ) {
                return new Response("Missing required fields", 400);
            }

            // Verificar duplicados
            $existing = $entityManager
                ->getRepository(ViewFields::class)
                ->findOneBy([
                    'view' => $data['view_id'],
                    'field' => $data['field_id']
                ]);

            if ($existing) {
                return new Response("Field already exists in this view", 409);
            }

            $view = $entityManager
                ->getRepository(Views::class)
                ->findOneBy(['id' => $data['view_id']]);

            if (!$view) {
                return new Response("View not found", 404);
            }

            $field = $entityManager
                ->getRepository(Fields::class)
                ->findOneBy(['id' => $data['field_id']]);

            if (!$field) {
                return new Response("Field not found", 404);
            }

            $viewField = new ViewFields();
            $viewField->setView($view);
            $viewField->setField($field);
            $viewField->setPosition($data['position'] ?? 0);

            $entityManager->persist($viewField);
            $entityManager->flush();

            $json = $serializer->serialize($viewField, 'json', ['groups' => 'view_fields:read']);

            return new Response($json, 201, ['Content-Type' => 'application/json']);
        }

        return new Response("Method not allowed", 405);
    }

    public function viewField(Request $request)
    {
        $id = $request->get('id');

        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('DELETE')) {
            $viewField = $entityManager
                ->getRepository(ViewFields::class)
                ->findOneBy(['id' => $id]);

            if (!$viewField) {
                return new Response("View field not found", 404);
            }

            $entityManager->remove($viewField);
            $entityManager->flush();

            return new Response("View field deleted", 204);
        }

        return new Response("Method not allowed", 405);
    }
}