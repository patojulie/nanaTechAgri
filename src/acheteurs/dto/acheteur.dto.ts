import { IsString, IsNumber, IsOptional, IsUUID, IsNotEmpty, IsEnum, Min, Max, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO Créer mon profil acheteur
 */
export class CreateAcheteurDto {
  @ApiProperty({ example: 'ENTREPRISE', description: 'Type de société (ENTREPRISE, RESTAURANT, DISTRIBUTEUR, PARTICULIER...)' })
  @IsString()
  typeSociete: string;

  @ApiPropertyOptional({ example: 'Sahel Food Distribution' })
  @IsString()
  @IsOptional()
  nomSociete?: string;

  @ApiPropertyOptional({ example: 'Zone industrielle, Lomé' })
  @IsString()
  @IsOptional()
  adresseSociete?: string;

  @ApiPropertyOptional({ example: 'Maritime' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ example: 'Togo', default: 'Togo' })
  @IsString()
  @IsOptional()
  pays?: string;

  @ApiPropertyOptional({ example: '+22870333003' })
  @IsString()
  @IsOptional()
  telephone?: string;

  @ApiPropertyOptional({ example: 'contact@sahelfood.test' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class AcheteurResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  typeSociete: string;

  @ApiPropertyOptional()
  nomSociete?: string;

  @ApiPropertyOptional()
  adresseSociete?: string;

  @ApiPropertyOptional()
  region?: string;

  @ApiProperty()
  pays: string;

  @ApiPropertyOptional()
  telephone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty()
  createdAt: Date;
}

/**
 * DTO Créer une mise en relation (Demande d'achat)
 */
export class CreateMiseEnRelationDto {
  @ApiProperty({
    description: 'ID de l\'annonce concernée',
    example: 'announcement-123-uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  announcementId: string;

  @ApiPropertyOptional({
    description: 'Quantité désirée (en unités du produit)',
    example: 100,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Note ou message pour le producteur',
    example: 'Intéressé par cette production, possibilité de contrat long terme',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({
    description: 'Contact préféré de l\'acheteur',
    example: '+221701234567',
  })
  @IsString()
  @IsOptional()
  preferredContact?: string;
}

/**
 * DTO Mettre à jour une mise en relation
 */
export class UpdateMiseEnRelationDto {
  @ApiPropertyOptional({
    description: 'Quantité révisée',
    example: 50,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Message révisé',
    example: 'Finalement on en veut un peu moins',
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({
    description: 'Contact révisé',
  })
  @IsString()
  @IsOptional()
  preferredContact?: string;
}

/**
 * DTO Statut mise en relation (Producteur accepte/refuse)
 */
export enum MiseEnRelationStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTEE = 'ACCEPTEE',
  REFUSEE = 'REFUSEE',
  REALISEE = 'REALISEE',
  ANNULEE = 'ANNULEE',
}

/**
 * DTO Répondre à une mise en relation
 */
export class RespondMiseEnRelationDto {
  @ApiProperty({
    enum: ['ACCEPTEE', 'REFUSEE'],
    description: 'Réponse du producteur à la demande d\'achat',
  })
  @IsEnum(['ACCEPTEE', 'REFUSEE'])
  @IsNotEmpty()
  status: 'ACCEPTEE' | 'REFUSEE';

  @ApiPropertyOptional({
    description: 'Raison du refus (si applicable)',
    example: 'Production insuffisante',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Quantité disponible que le producteur peut fournir',
    example: 50,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  availableQuantity?: number;
}

/**
 * DTO Réponse mise en relation
 */
export class MiseEnRelationResponseDto {
  @ApiProperty({
    description: 'ID unique de la mise en relation',
    example: 'relation-123-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'ID de l\'acheteur',
    example: 'buyer-456-uuid',
  })
  buyerId: string;

  @ApiProperty({
    description: 'Informations acheteur',
  })
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };

  @ApiProperty({
    description: 'ID du producteur',
    example: 'producer-789-uuid',
  })
  producerId: string;

  @ApiProperty({
    description: 'Informations producteur',
  })
  producer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };

  @ApiProperty({
    description: 'ID de l\'annonce',
    example: 'announcement-111-uuid',
  })
  announcementId: string;

  @ApiProperty({
    description: 'Détails annonce',
  })
  announcement: {
    id: string;
    productType: string;
    quantity: number;
    price: number;
  };

  @ApiProperty({
    enum: MiseEnRelationStatut,
    description: 'Statut de la mise en relation',
    example: 'EN_ATTENTE',
  })
  status: MiseEnRelationStatut;

  @ApiPropertyOptional({
    description: 'Quantité demandée',
    example: 100,
  })
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Message de l\'acheteur',
  })
  message?: string;

  @ApiProperty({
    description: 'Date de création',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Date de dernière modification',
  })
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Raison du refus (si applicable)',
  })
  rejectionReason?: string;
}

/**
 * DTO Réponse de recherche annonces (pour acheteurs)
 */
export class AnnouncementSearchResponseDto {
  @ApiProperty({
    description: 'ID annonce',
    example: 'announcement-123-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Type de produit',
    example: 'Millet',
  })
  productType: string;

  @ApiProperty({
    description: 'Variété du produit',
    example: 'Millet blanc extra',
  })
  productVariety: string;

  @ApiProperty({
    description: 'Quantité disponible',
    example: 500,
  })
  quantity: number;

  @ApiProperty({
    description: 'Unité (kg, tonnes, sacs, etc)',
    example: 'kg',
  })
  unit: string;

  @ApiProperty({
    description: 'Prix unitaire',
    example: 250,
  })
  pricePerUnit: number;

  @ApiProperty({
    description: 'Région de production',
    example: 'Kayes',
  })
  region: string;

  @ApiProperty({
    description: 'Informations producteur',
  })
  producer: {
    id: string;
    name: string;
    region: string;
    email: string;
    phone?: string;
  };

  @ApiProperty({
    description: 'Date publication',
  })
  publishedAt: Date;

  @ApiPropertyOptional({
    description: 'Nombre de demandes d\'achat',
    example: 3,
  })
  demandCount?: number;
}

/**
 * DTO Filtre recherche annonces
 */
export class SearchFiltersDto {
  @ApiPropertyOptional({
    description: 'Type de produit à chercher',
    example: 'Millet',
  })
  @IsString()
  @IsOptional()
  productType?: string;

  @ApiPropertyOptional({
    description: 'Région de production',
    example: 'Kayes',
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    description: 'Prix minimum',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Prix maximum',
    example: 500,
  })
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Quantité minimale',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  minQuantity?: number;

  @ApiPropertyOptional({
    description: 'Pagination: sauter N résultats',
    example: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  skip?: number;

  @ApiPropertyOptional({
    description: 'Pagination: prendre N résultats',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  take?: number;
}

/**
 * DTO Panier acheteur
 */
export class CartItemDto {
  @ApiProperty({
    description: 'ID annonce',
    example: 'announcement-123-uuid',
  })
  announcementId: string;

  @ApiProperty({
    description: 'Détails annonce',
  })
  announcement: {
    id: string;
    productType: string;
    pricePerUnit: number;
    producer: {
      id: string;
      name: string;
    };
  };

  @ApiProperty({
    description: 'Quantité dans le panier',
    example: 100,
  })
  quantity: number;

  @ApiProperty({
    description: 'Sous-total (quantity * pricePerUnit)',
    example: 25000,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Date d\'ajout au panier',
  })
  addedAt: Date;
}

export class CartResponseDto {
  @ApiProperty({
    description: 'Items dans le panier',
    type: [CartItemDto],
  })
  items: CartItemDto[];

  @ApiProperty({
    description: 'Nombre total d\'articles',
    example: 2,
  })
  itemCount: number;

  @ApiProperty({
    description: 'Total du panier',
    example: 50000,
  })
  total: number;

  @ApiProperty({
    description: 'Devise',
    example: 'XOF',
  })
  currency: string;
}

/**
 * DTO Recommandations pour acheteur
 */
export class RecommendationDto {
  @ApiProperty({
    description: 'ID annonce recommandée',
  })
  id: string;

  @ApiProperty({
    description: 'Type de produit',
  })
  productType: string;

  @ApiProperty({
    description: 'Score de pertinence (0-100)',
    example: 85,
  })
  relevanceScore: number;

  @ApiProperty({
    description: 'Raison de la recommandation',
    example: 'Similar à vos recherches précédentes',
  })
  reason: string;

  @ApiProperty({
    description: 'Informations producteur',
  })
  producer: {
    id: string;
    name: string;
    rating?: number;
  };

  @ApiProperty({
    description: 'Prix unitaire',
  })
  pricePerUnit: number;
}
