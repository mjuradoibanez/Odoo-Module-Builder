<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Fields
 *
 * @ORM\Table(name="fields", indexes={@ORM\Index(name="fk_fields_model", columns={"model_id"})})
 * @ORM\Entity
 */
class Fields
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer", nullable=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     *
     * @Groups({"fields:read"})
     */
    private $id;

    /**
     * @var string
     *
     * @ORM\Column(name="name", type="string", length=255, nullable=false)
     *
     * @Groups({"fields:read"})
     */
    private $name;

    /**
     * @var string
     *
     * @ORM\Column(name="technical_name", type="string", length=255, nullable=false)
     *
     * @Groups({"fields:read"})
     */
    private $technicalName;

    /**
     * @var string
     *
     * @ORM\Column(name="type", type="string", length=255, nullable=false)
     *
     * @Groups({"fields:read"})
     */
    private $type;

    /**
     * @var bool|null
     *
     * @ORM\Column(name="required", type="boolean", nullable=true)
     *
     * @Groups({"fields:read"})
     */
    private $required = '0';

    /**
     * @var bool|null
     *
     * @ORM\Column(name="unique_field", type="boolean", nullable=true)
     *
     * @Groups({"fields:read"})
     */
    private $uniqueField = false;

    /**
     * @var string|null
     *
     * @ORM\Column(name="relation_model", type="string", length=255, nullable=true)
     *
     * @Groups({"fields:read"})
     */
    private $relationModel;

    /**
     * @var string|null
     *
     * @ORM\Column(name="relation_field", type="string", length=255, nullable=true)
     *
     * @Groups({"fields:read"})
     */
    private $relationField;

    /**
     * @var string|null
     *
     * @ORM\Column(name="relation_module", type="string", length=255, nullable=true)
     *
     * @Groups({"fields:read"})
     */
    private $relationModule;
    
    /**
     * @var Models
     *
     * @ORM\ManyToOne(targetEntity="Models")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="model_id", referencedColumnName="id")
     * })
     *
     * @Groups({"fields:read"})
     */
    private $model;

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

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): void
    {
        $this->type = $type;
    }

    public function getUniqueField(): ?bool
    {
        return $this->uniqueField;
    }

    public function setUniqueField(?bool $uniqueField): void
    {
        $this->uniqueField = $uniqueField;
    }

    public function getRelationField(): ?string
    {
        return $this->relationField;
    }

    public function setRelationField(?string $relationField): void
    {
        $this->relationField = $relationField;
    }

    /**
     * @return bool|string|null
     */
    public function getRequired()
    {
        return $this->required;
    }

    /**
     * @param bool|string|null $required
     */
    public function setRequired($required): void
    {
        $this->required = $required;
    }

    public function getRelationModel(): ?string
    {
        return $this->relationModel;
    }

    public function setRelationModel(?string $relationModel): void
    {
        $this->relationModel = $relationModel;
    }

    public function getRelationModule(): ?string
    {
        return $this->relationModule;
    }

    public function setRelationModule(?string $relationModule): void
    {
        $this->relationModule = $relationModule;
    }

    public function getModel(): Models
    {
        return $this->model;
    }

    public function setModel(Models $model): void
    {
        $this->model = $model;
    }
}
