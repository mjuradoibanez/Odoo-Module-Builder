<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Favorites
 *
 * @ORM\Table(name="favorites",
 *   indexes={
 *     @ORM\Index(name="fk_favorites_user", columns={"user_id"}),
 *     @ORM\Index(name="fk_favorites_module", columns={"module_id"})
 *   },
 *   uniqueConstraints={
 *     @ORM\UniqueConstraint(name="uq_user_module_favorite", columns={"user_id", "module_id"})
 *   }
 * )
 * @ORM\Entity
 */
class Favorites
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer", nullable=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     *
     * @Groups({"favorites:read"})
     */
    private $id;

    /**
     * @var Users
     *
     * @ORM\ManyToOne(targetEntity="Users")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="user_id", referencedColumnName="id", onDelete="CASCADE")
     * })
     *
     * @Groups({"favorites:read"})
     */
    private $user;

    /**
     * @var Modules
     *
     * @ORM\ManyToOne(targetEntity="Modules")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="module_id", referencedColumnName="id", onDelete="CASCADE")
     * })
     *
     * @Groups({"favorites:read"})
     */
    private $module;

    /**
     * @var \DateTime|null
     *
     * @ORM\Column(name="created_at", type="datetime", nullable=true, options={"default"="CURRENT_TIMESTAMP"})
     *
     * @Groups({"favorites:read"})
     */
    private $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getUser(): Users
    {
        return $this->user;
    }

    public function setUser(Users $user): void
    {
        $this->user = $user;
    }

    public function getModule(): Modules
    {
        return $this->module;
    }

    public function setModule(Modules $module): void
    {
        $this->module = $module;
    }

    public function getCreatedAt(): ?\DateTime
    {
        return $this->createdAt;
    }

    public function setCreatedAt(?\DateTime $createdAt): void
    {
        $this->createdAt = $createdAt;
    }
}
