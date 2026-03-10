<?php

namespace App\Controller;

use App\Entity\Fields;
use App\Entity\Models;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;

class FieldController extends AbstractController
{
    public function fields(Request $request, SerializerInterface $serializer)
    {
        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $fields = $entityManager
                ->getRepository(Fields::class)
                ->findAll();

            if (!$fields) {
                return new Response("Fields not found", 400);
            }

            $data = $serializer->serialize($fields, 'json', ['groups' => 'fields:read']);

            return new Response($data, 200, ['Content-Type' => 'application/json']);

        } else if ($request->isMethod('POST')){
            $data = json_decode($request->getContent(), true);

            if (!$data){
                return new Response("Invalid JSON", 400);
            }

            // Validar campos obligatorios
            if (
                empty($data['name']) ||
                empty($data['technicalName']) ||
                empty($data['type']) ||
                empty($data['model_id'])
            ) {
                return new Response("Missing required fields", 400);
            }

            $entityManager = $this->getDoctrine()->getManager();

            // Verificar duplicados
            $existing = $entityManager
                ->getRepository(Fields::class)
                ->findOneBy([
                    'technicalName' => $data['technicalName'],
                    'model' => $data['model_id']
                ]);

            if ($existing){
                return new Response("Field already exists in this model", 404);
            }

            $model = $entityManager
                ->getRepository(Models::class)
                ->findOneBy(['id' => $data['model_id']]);

            if (!$model){
                return new Response("Model not found", 404);
            }

            // Crear field
            $field = new Fields();

            $field->setName($data['name']);
            $field->setTechnicalName($data['technicalName']);
            $field->setType($data['type']);
            $field->setRequired($data['required'] ?? false);
            $field->setRelationModel($data['relationModel'] ?? null);
            $field->setModel($model);

            // Guardar
            $entityManager->persist($field);
            $entityManager->flush();

            $json = $serializer->serialize($field, 'json', ['groups' => 'fields:read']);

            return new Response($json, 201, [ 'Content-Type' => 'application/json']);
        }

        return new Response("Method not allowed", 405);
    }

    public function field(Request $request, SerializerInterface $serializer)
    {
        $id = $request->get('id');

        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $field = $entityManager
                ->getRepository(Fields::class)
                ->findOneBy(['id' => $id]);

            if (!$field) {
                return new Response("Field not found", 404);
            }

            $data = $serializer->serialize($field, 'json', ['groups' => 'fields:read']);

            return new Response($data, 200, ['Content-Type' => 'application/json']);

        } else if ($request->isMethod('DELETE')) {
            $field = $entityManager
                ->getRepository(Fields::class)
                ->findOneBy(['id' => $id]);

            if (!$field) {
                return new Response("Field not found", 404);
            }

            $entityManager->remove($field);
            $entityManager->flush();

            return new Response("Field deleted", 204);

        } else if ($request->isMethod('PUT')) {
            $field = $entityManager
                ->getRepository(Fields::class)
                ->findOneBy(['id' => $id]);

            if (!$field) {
                return new Response("Field not found", 404);
            }

            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new Response("Invalid JSON", 400);
            }

            // Verificar duplicado
            if (isset($data['technicalName'])) {
                $existing = $entityManager
                    ->getRepository(Fields::class)
                    ->findOneBy([
                        'technicalName' => $data['technicalName'],
                        'model' => $field->getModel()->getId()
                    ]);

                if ($existing && $existing->getId() != $field->getId()) {
                    return new Response("technicalName already exists in this model", 409);
                }
            }

            $serializer->deserialize(
                json_encode($data),
                Fields::class,
                'json',
                ['object_to_populate' => $field]
            );

            if (isset($data['model_id'])) {
                $model = $entityManager
                    ->getRepository(Models::class)
                    ->findOneBy(['id' => $data['model_id']]);

                if (!$model) {
                    return new Response("Model not found", 404);
                }

                $field->setModel($model);
            }

            $entityManager->flush();

            $json = $serializer->serialize($field, 'json', ['groups' => 'fields:read']);

            return new Response($json, 200, ['Content-Type' => 'application/json']);
        }

        return new Response("Method not allowed", 405);
    }
}