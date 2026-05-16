alter table ratings
  add column creamy_rating integer check (creamy_rating >= 0 and creamy_rating <= 5);