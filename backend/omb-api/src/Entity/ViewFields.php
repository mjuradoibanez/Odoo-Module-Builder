<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * ViewFields
 *
 * @ORM\Table(name="view_fields", indexes={@ORM\Index(name="fk_view_fields_view", columns={"view_id"}), @ORM\Index(name="fk_view_fields_field", columns={"field_id"})})
 * @ORM\Entity
 */
class ViewFields
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
     * @var int|null
     *
     * @ORM\Column(name="position", type="integer", nullable=true)
     */
    private $position = '0';

    /**
     * @var Views
     *
     * @ORM\ManyToOne(targetEntity="Views")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="view_id", referencedColumnName="id")
     * })
     */
    private $view;

    /**
     * @var Fields
     *
     * @ORM\ManyToOne(targetEntity="Fields")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="field_id", referencedColumnName="id")
     * })
     */
    private $field;

    public function getId(): int
    {
        return $this->id;
    }

    public function getPosition(): int|string|null
    {
        return $this->position;
    }

    public function setPosition(int|string|null $position): void
    {
        $this->position = $position;
    }

    public function getView(): Views
    {
        return $this->view;
    }

    public function setView(Views $view): void
    {
        $this->view = $view;
    }

    public function getField(): Fields
    {
        return $this->field;
    }

    public function setField(Fields $field): void
    {
        $this->field = $field;
    }
}
