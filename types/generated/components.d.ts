import type { Schema, Struct } from '@strapi/strapi';

export interface OrderOrderItem extends Struct.ComponentSchema {
  collectionName: 'components_order_items';
  info: {
    description: 'Individual item in an order';
    displayName: 'Order Item';
  };
  attributes: {
    price: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    product: Schema.Attribute.Relation<'oneToOne', 'api::product.product'>;
    productId: Schema.Attribute.String;
    productName: Schema.Attribute.String;
    productNameAr: Schema.Attribute.String;
    quantity: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    total: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

export interface ProductImageGallery extends Struct.ComponentSchema {
  collectionName: 'components_product_image_galleries';
  info: {
    description: 'Product image with main image flag';
    displayName: 'Image Gallery';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    isMain: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    url: Schema.Attribute.String;
  };
}

export interface ProductReview extends Struct.ComponentSchema {
  collectionName: 'components_product_reviews';
  info: {
    description: 'Product review with multi-language support';
    displayName: 'Review';
  };
  attributes: {
    author: Schema.Attribute.String & Schema.Attribute.Required;
    authorAr: Schema.Attribute.String;
    comment: Schema.Attribute.Text & Schema.Attribute.Required;
    commentAr: Schema.Attribute.Text;
    date: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
          min: 0;
        },
        number
      >;
    verified: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'order.order-item': OrderOrderItem;
      'product.image-gallery': ProductImageGallery;
      'product.review': ProductReview;
    }
  }
}
