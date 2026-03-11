<?php

namespace App\Controller;

use App\Entity\Users;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;

class UserController extends AbstractController
{
    public function users(Request $request, SerializerInterface $serializer)
    {
        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $users = $entityManager
                ->getRepository(Users::class)
                ->findAll();

            if (!$users) {
                return new Response("Users not found", 400);
            }

            $data = $serializer->serialize($users, 'json', ['groups' => 'users:read']);

            return new Response($data, 200, ['Content-Type' => 'application/json']);

        } else if ($request->isMethod('POST')) {
            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new Response("Invalid JSON", 400);
            }

            if (
                empty($data['email']) ||
                empty($data['password'])
            ) {
                return new Response("Missing required fields", 400);
            }

            // Verificar email duplicado
            $existing = $entityManager
                ->getRepository(Users::class)
                ->findOneBy(['email' => $data['email']]);

            if ($existing) {
                return new Response("Email already exists", 409);
            }

            $user = new Users();
            $user->setEmail($data['email']);
            $user->setPassword(password_hash($data['password'], PASSWORD_BCRYPT));
            $entityManager->persist($user);
            $entityManager->flush();

            $json = $serializer->serialize($user, 'json', ['groups' => 'users:read']);

            return new Response($json, 201, ['Content-Type' => 'application/json']);
        }

        return new Response("Method not allowed", 405);
    }

    public function user(Request $request, SerializerInterface $serializer)
    {
        $id = $request->get('id');

        $entityManager = $this->getDoctrine()->getManager();

        if ($request->isMethod('GET')) {
            $user = $entityManager
                ->getRepository(Users::class)
                ->findOneBy(['id' => $id]);

            if (!$user) {
                return new Response("User not found", 404);
            }

            $data = $serializer->serialize($user, 'json', ['groups' => 'users:read']);

            return new Response($data, 200, ['Content-Type' => 'application/json']);

        } else if ($request->isMethod('PUT')) {
            $user = $entityManager
                ->getRepository(Users::class)
                ->findOneBy(['id' => $id]);

            if (!$user) {
                return new Response("User not found", 404);
            }

            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new Response("Invalid JSON", 400);
            }

            // Verificar email duplicado si se está cambiando
            if (isset($data['email'])) {
                $existing = $entityManager
                    ->getRepository(Users::class)
                    ->findOneBy(['email' => $data['email']]);

                if ($existing && $existing->getId() != $user->getId()) {
                    return new Response("Email already exists", 409);
                }

                $user->setEmail($data['email']);
            }

            // Hashear la nueva contraseña si se está cambiando
            if (isset($data['password'])) {
                $user->setPassword(password_hash($data['password'], PASSWORD_BCRYPT));
            }

            $entityManager->flush();

            $json = $serializer->serialize($user, 'json', ['groups' => 'users:read']);

            return new Response($json, 200, ['Content-Type' => 'application/json']);

        } else if ($request->isMethod('DELETE')) {
            $user = $entityManager
                ->getRepository(Users::class)
                ->findOneBy(['id' => $id]);

            if (!$user) {
                return new Response("User not found", 404);
            }

            $entityManager->remove($user);
            $entityManager->flush();

            return new Response("User deleted", 204);
        }

        return new Response("Method not allowed", 405);
    }

    public function login(Request $request, SerializerInterface $serializer)
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return new Response("Invalid JSON", 400);
        }

        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$email || !$password) {
            return new Response("Missing credentials", 400);
        }

        $user = $this->getDoctrine()
            ->getRepository(Users::class)
            ->findOneBy(['email' => $email]);

        if (!$user) {
            return new Response("User not found", 404);
        }

        if (!password_verify($password, $user->getPassword())) {
            return new Response("Invalid password", 401);
        }

        $json = $serializer->serialize(
            $user,
            'json',
            ['groups' => 'users:read']
        );

        return new Response($json, 200, ['Content-Type' => 'application/json']);
    }
}