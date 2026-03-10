<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Models
 *
 * @ORM\Table(name="models", indexes={@ORM\Index(name="fk_models_module", columns={"module_id"})})
 * @ORM\Entity
 */
class Models
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer", nullable=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     *
     * @Groups({"models:read", "fields:read", "views:read"})
     */
    private $id;

    /**
     * @var string
     *
     * @ORM\Column(name="name", type="string", length=255, nullable=false)
     *
     * @Groups({"models:read", "fields:read", "views:read"})
     */
    private $name;

    /**
     * @var string
     *
     * @ORM\Column(name="technical_name", type="string", length=255, nullable=false)
     *
     * @Groups({"models:read"})
     */
    private $technicalName;

    /**
     * @var Modules
     *
     * @ORM\ManyToOne(targetEntity="Modules")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="module_id", referencedColumnName="id")
     * })
     *
     * @Groups({"models:read"})
     */
    private $module;

    public function getId(): int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getTechnicalName(): string
    {
        return $this->technicalName;
    }

    public function setTechnicalName(string $technicalName): void
    {
        $this->technicalName = $technicalName;
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
