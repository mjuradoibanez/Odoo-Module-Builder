<?php

namespace App\Controller;

use App\Entity\Models;
use App\Entity\Modules;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;

class ModelController extends AbstractController
{
    public function models(Request $request, SerializerInterface $serializer)
    {
        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $models = $entityManager
                ->getRepository(Models::class)
                ->findAll();

            if (!$models){
                return new Response("Models not found", 400);
            }

            $data = $serializer->serialize($models, 'json', ['groups' => 'models:read']);

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
                empty($data['module_id'])
            ) {
                return new Response("Missing required fields", 400);
            }

            $entityManager = $this->getDoctrine()->getManager();

            // Verificar duplicados
            $existing = $entityManager
                ->getRepository(Models::class)
                ->findOneBy(['technicalName' => $data['technicalName']]);

            if ($existing){
                return new Response("Model already exists", 404);
            }

            $module = $entityManager
                ->getRepository(Modules::class)
                ->findOneBy(['id' => $data['module_id']]);

            if (!$module){
                return new Response("Module not found", 404);
            }

            // Crear modelo
            $model = new Models();

            $model->setName($data['name']);
            $model->setTechnicalName($data['technicalName']);
            $model->setModule($module);

            // Guardar
            $entityManager->persist($model);
            $entityManager->flush();

            $json = $serializer->serialize($model, 'json', ['groups' => 'models:read']);

            return new Response($json, 201, [ 'Content-Type' => 'application/json']);
        }

        return new Response("Method not allowed", 405);
    }

    public function model(Request $request, SerializerInterface $serializer)
    {
        $id = $request->get('id');

        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $model = $entityManager
                ->getRepository(Models::class)
                ->findOneBy(['id' => $id]);

            if (!$model){
                return new Response("Model not found", 400);
            }

            $data = $serializer->serialize($model, 'json', ['groups' => 'models:read']);

            return new Response($data, 200, ['Content-Type' => 'application/json']);

        } else if ($request->isMethod('DELETE')){
            $model = $entityManager
                ->getRepository(Models::class)
                ->findOneBy(['id' => $id]);

            if (!$model){
                return new Response("Model not found", 404);
            }

            $entityManager->remove($model);
            $entityManager->flush();

            return new Response("Model deleted", 204);

        } else if ($request->isMethod('PUT')){
            $model = $entityManager
                ->getRepository(Models::class)
                ->findOneBy(['id' => $id]);

            if (!$model){
                return new Response("Model not found", 404);
            }

            $data = json_decode($request->getContent(), true);

            if (!$data){
                return new Response("Invalid JSON", 400);
            }

            // Actualizar objeto
            $serializer->deserialize(
                json_encode($data),
                Models::class,
                'json',
                ['object_to_populate' => $model]
            );

            // Validar duplicados
            $existing = $entityManager
                ->getRepository(Models::class)
                ->findOneBy(['technicalName' => $model->getTechnicalName()]);

            if ($existing && $existing->getId() != $model->getId()){
                return new Response("technicalName already exists", 409);
            }

            // Relación module
            if (isset($data['module_id'])){
                $module = $entityManager
                    ->getRepository(Modules::class)
                    ->findOneBy(['id' => $data['modules_id']]);

                if (!$module){
                    return new Response("Module not found", 404);
                }

                $model->setModule($module);
            }

            $entityManager->flush();

            $json = $serializer->serialize(
                $model,
                'json',
                ['groups'=>'models:read']
            );

            return new Response($json, 200, ['Content-Type'=>'application/json']);
        }

        return new Response("Method not allowed", 405);
    }
}