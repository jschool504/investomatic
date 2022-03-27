create table orders (
    id bigserial primary key,
    ticker text not null,
    quantity integer not null,
    price decimal not null,
    timestamp text not null
);
