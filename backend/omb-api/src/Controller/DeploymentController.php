<?php

namespace App\Controller;

use App\Entity\Deployments;
use App\Entity\Modules;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;

class DeploymentController extends AbstractController
{
    public function deployments(Request $request, SerializerInterface $serializer)
    {
        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $deployments = $entityManager
                ->getRepository(Deployments::class)
                ->findAll();

            if (!$deployments) {
                return new Response("Deployments not found", 400);
            }

            $data = $serializer->serialize($deployments, 'json', ['groups' => 'deployments:read']);

            return new Response($data, 200, ['Content-Type' => 'application/json']);

        } else if ($request->isMethod('POST')) {
            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new Response("Invalid JSON", 400);
            }

            if (empty($data['module_id'])) {
                return new Response("Missing required fields", 400);
            }

            $module = $entityManager
                ->getRepository(Modules::class)
                ->findOneBy(['id' => $data['module_id']]);

            if (!$module) {
                return new Response("Module not found", 404);
            }

            $deployment = new Deployments();
            $deployment->setStatus($data['status'] ?? null);
            $deployment->setLog($data['log'] ?? null);
            $deployment->setModule($module);

            $entityManager->persist($deployment);
            $entityManager->flush();

            $json = $serializer->serialize($deployment, 'json', ['groups' => 'deployments:read']);

            return new Response($json, 201, ['Content-Type' => 'application/json']);
        }

        return new Response("Method not allowed", 405);
    }

    public function deployment(Request $request, SerializerInterface $serializer)
    {
        $id = $request->get('id');

        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $deployment = $entityManager
                ->getRepository(Deployments::class)
                ->findOneBy(['id' => $id]);

            if (!$deployment) {
                return new Response("Deployment not found", 404);
            }

            $data = $serializer->serialize($deployment, 'json', ['groups' => 'deployments:read']);

            return new Response($data, 200, ['Content-Type' => 'application/json']);

        } else if ($request->isMethod('DELETE')) {
            $deployment = $entityManager
                ->getRepository(Deployments::class)
                ->findOneBy(['id' => $id]);

            if (!$deployment) {
                return new Response("Deployment not found", 404);
            }

            $entityManager->remove($deployment);
            $entityManager->flush();

            return new Response("Deployment deleted", 204);
        }

        return new Response("Method not allowed", 405);
    }
}