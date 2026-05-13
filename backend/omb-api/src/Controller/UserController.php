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


            if (empty($data['email']) || empty($data['password'])) {
                return new Response("Missing required fields", 400);
            }

            // Username obligatorio, pero si no lo envía, usar la parte antes de @ del email
            $username = $data['username'] ?? null;
            if (!$username) {
                $username = explode('@', $data['email'])[0];
            }

            // Verificar email duplicado
            $existing = $entityManager
                ->getRepository(Users::class)
                ->findOneBy(['email' => $data['email']]);

            if ($existing) {
                return new Response("Email already exists", 409);
            }

            // Verificar username duplicado
            $existing = $entityManager
                ->getRepository(Users::class)
                ->findOneBy(['username' => $username]);

            if ($existing) {
                return new Response("Username already exists", 409);
            }


            // Lista de avatares predeterminados
            $defaultAvatars = [
                'avatar_01.png', 'avatar_02.png', 'avatar_03.png', 'avatar_04.png',
                'avatar_05.png', 'avatar_06.png', 'avatar_07.png', 'avatar_08.png',
            ];

            $user = new Users();
            $user->setEmail($data['email']);
            $user->setUsername($username);
            $user->setPassword(password_hash($data['password'], PASSWORD_BCRYPT));
            // Asignar un avatar aleatorio por defecto
            $user->setAvatar($defaultAvatars[array_rand($defaultAvatars)]);
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

            // Actualizar username si se envía
            if (isset($data['username'])) {
                $existing = $entityManager
                    ->getRepository(Users::class)
                    ->findOneBy(['username' => $data['username']]);

                if ($existing && $existing->getId() != $user->getId()) {
                    return new Response("Username already exists", 409);
                }

                $user->setUsername($data['username']);
            }

            // Actualizar avatar si se envía (incluye null para quitar la foto)
            if (array_key_exists('avatar', $data)) {
                $user->setAvatar($data['avatar']);
            }

            // Cambiar contraseña: requiere la contraseña actual para verificar
            if (isset($data['password'])) {
                $currentPassword = $data['currentPassword'] ?? null;
                if (!$currentPassword) {
                    return new Response("Current password is required", 400);
                }
                if (!password_verify($currentPassword, $user->getPassword())) {
                    return new Response("Current password is incorrect", 401);
                }
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

            // Las entidades relacionadas tienen onDelete="CASCADE" así que no hace falta borrarlo todo manualmente
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