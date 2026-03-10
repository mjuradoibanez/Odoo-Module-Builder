<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Deployments
 *
 * @ORM\Table(name="deployments", indexes={@ORM\Index(name="fk_deployments_module", columns={"module_id"})})
 * @ORM\Entity
 */
class Deployments
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer", nullable=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     *
     * @Groups({"deployments:read"})
     */
    private $id;

    /**
     * @var string|null
     *
     * @ORM\Column(name="status", type="string", length=255, nullable=true)
     *
     * @Groups({"deployments:read"})
     */
    private $status;

    /**
     * @var string|null
     *
     * @ORM\Column(name="log", type="text", length=65535, nullable=true)
     *
     * @Groups({"deployments:read"})
     */
    private $log;

    /**
     * @var \DateTime|null
     *
     * @ORM\Column(name="created_at", type="datetime", nullable=true, options={"default"="CURRENT_TIMESTAMP"})
     *
     * @Groups({"deployments:read"})
     */
    private $createdAt = null;

    /**
     * @var Modules
     *
     * @ORM\ManyToOne(targetEntity="Modules")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="module_id", referencedColumnName="id")
     * })
     *
     * @Groups({"deployments:read"})
     */
    private $module;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(?string $status): void
    {
        $this->status = $status;
    }

    public function getLog(): ?string
    {
        return $this->log;
    }

    public function setLog(?string $log): void
    {
        $this->log = $log;
    }

    public function getCreatedAt(): ?\DateTime
    {
        return $this->createdAt;
    }

    public function setCreatedAt(?\DateTime $createdAt): void
    {
        $this->createdAt = $createdAt;
    }

    public function getModule(): Modules
    {
        return $this->module;
    }

    public function setModule(Modules $module): void
    {
        $this->module = $module;
    }

}
