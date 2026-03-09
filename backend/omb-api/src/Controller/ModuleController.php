<?php

namespace App\Controller;

use App\Entity\Modules;
use App\Entity\Users;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;

class ModuleController extends AbstractController
{
    public function modules(Request $request, SerializerInterface $serializer)
    {
        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $modules = $entityManager
                ->getRepository(Modules::class)
                ->findAll();

            if (!$modules){
                return new Response("Modules not found", 400);
            }

            $data = $serializer->serialize($modules, 'json', ['groups' => 'modules:read']);

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
                empty($data['user_id'])
            ) {
                return new Response("Missing required fields", 400);
            }

            $entityManager = $this->getDoctrine()->getManager();

            // Verificar duplicados
            $existing = $entityManager
                ->getRepository(Modules::class)
                ->findOneBy(['technicalName' => $data['technicalName']]);

            if ($existing){
                return new Response("Module already exists", 404);
            }

            $user = $entityManager
                ->getRepository(Users::class)
                ->findOneBy(['id' => $data['user_id']]);

            if (!$user){
                return new Response("User not found", 404);
            }

            // Crear modulo
            $module = new Modules();

            $module->setName($data['name']);
            $module->setTechnicalName($data['technicalName']);
            $module->setDescription($data['description'] ?? null);
            $module->setVersion($data['version'] ?? 1.0);
            $module->setAuthor($data['author'] ?? null);
            $module->setUser($user);

            // Guardar
            $entityManager->persist($module);
            $entityManager->flush();

            $json = $serializer->serialize($module, 'json', ['groups' => 'modules:read']);

            return new Response($json, 201, [ 'Content-Type' => 'application/json']);
        }

        return new Response("Method not allowed", 405);
    }

    public function module(Request $request, SerializerInterface $serializer)
    {
        $id = $request->get('id');

        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $module = $entityManager
                ->getRepository(Modules::class)
                ->findOneBy(['id' => $id]);

            if (!$module){
                return new Response("Module not found", 400);
            }

            $data = $serializer->serialize($module, 'json', ['groups' => 'modules:read']);

            return new Response($data, 200, ['Content-Type' => 'application/json']);

        } else if ($request->isMethod('DELETE')){
            $module = $entityManager
                ->getRepository(Modules::class)
                ->findOneBy(['id' => $id]);

            if (!$module){
                return new Response("Module not found", 404);
            }

            $entityManager->remove($module);
            $entityManager->flush();

            return new Response("Module deleted", 204);
        }

        return new Response("Method not allowed", 405);
    }
}