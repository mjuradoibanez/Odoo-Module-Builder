<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

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
     */
    private $id;

    /**
     * @var string|null
     *
     * @ORM\Column(name="status", type="string", length=255, nullable=true)
     */
    private $status;

    /**
     * @var string|null
     *
     * @ORM\Column(name="log", type="text", length=65535, nullable=true)
     */
    private $log;

    /**
     * @var \DateTime|null
     *
     * @ORM\Column(name="created_at", type="datetime", nullable=true, options={"default"="CURRENT_TIMESTAMP"})
     */
    private $createdAt = 'CURRENT_TIMESTAMP';

    /**
     * @var Modules
     *
     * @ORM\ManyToOne(targetEntity="Modules")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="module_id", referencedColumnName="id")
     * })
     */
    private $module;

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

    public function getCreatedAt(): \DateTime|string|null
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTime|string|null $createdAt): void
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
