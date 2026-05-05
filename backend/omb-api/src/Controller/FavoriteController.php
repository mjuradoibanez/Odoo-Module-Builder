<?php

namespace App\Controller;

use App\Entity\Favorites;
use App\Entity\Modules;
use App\Entity\Users;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;

class FavoriteController extends AbstractController
{
    public function userFavorites(Request $request, SerializerInterface $serializer)
    {
        $userId = $request->get('user_id');
        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $user = $entityManager
                ->getRepository(Users::class)
                ->find($userId);

            if (!$user) {
                return new Response("User not found", 404);
            }

            $favorites = $entityManager
                ->getRepository(Favorites::class)
                ->findBy(['user' => $user]);

            // Devolver los favoritos con id, modulo y fecha
            $result = array_map(function($fav) {
                $module = $fav->getModule();
                return [
                    'id' => $fav->getId(),
                    'moduleId' => $module->getId(),
                    'name' => $module->getName(),
                    'technicalName' => $module->getTechnicalName(),
                    'description' => $module->getDescription(),
                    'version' => $module->getVersion(),
                    'author' => $module->getAuthor(),
                    'category' => $module->getCategory(),
                    'isPublic' => $module->getIsPublic(),
                    'createdAt' => $module->getCreatedAt(),
                    'user' => [
                        'id' => $module->getUser()->getId(),
                        'username' => $module->getUser()->getUsername(),
                        'email' => $module->getUser()->getEmail(),
                    ],
                    'favoritedAt' => $fav->getCreatedAt(),
                ];
            }, $favorites);

            return $this->json(array_values($result));

        } else if ($request->isMethod('POST')) {
            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new Response("Invalid JSON", 400);
            }

            if (empty($data['module_id'])) {
                return new Response("Missing module_id", 400);
            }

            $user = $entityManager
                ->getRepository(Users::class)
                ->find($userId);

            if (!$user) {
                return new Response("User not found", 404);
            }

            $module = $entityManager
                ->getRepository(Modules::class)
                ->find($data['module_id']);

            if (!$module) {
                return new Response("Module not found", 404);
            }

            // Verificar si ya existe el favorito
            $existing = $entityManager
                ->getRepository(Favorites::class)
                ->findOneBy([
                    'user' => $user,
                    'module' => $module
                ]);

            if ($existing) {
                return new Response("Already a favorite", 409);
            }

            $favorite = new Favorites();
            $favorite->setUser($user);
            $favorite->setModule($module);

            $entityManager->persist($favorite);
            $entityManager->flush();

            $json = $serializer->serialize($favorite, 'json', ['groups' => 'favorites:read']);

            return new Response($json, 201, ['Content-Type' => 'application/json']);
        }

        return new Response("Method not allowed", 405);
    }

    public function favorite(Request $request, SerializerInterface $serializer)
    {
        $id = $request->get('id');
        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('DELETE')) {
            $favorite = $entityManager
                ->getRepository(Favorites::class)
                ->find($id);

            if (!$favorite) {
                return new Response("Favorite not found", 404);
            }

            $entityManager->remove($favorite);
            $entityManager->flush();

            return new Response("Favorite deleted", 204);
        }

        return new Response("Method not allowed", 405);
    }
}
