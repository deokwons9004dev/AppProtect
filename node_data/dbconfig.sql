create database if not exists Aprotect;
use Aprotect;

create table if not exists Users (
	user_id    varchar(150) not null,
	user_ps    varchar(150) not null,
	user_tok   varchar(150) not null,
	user_sites text                 ,
	UNIQUE (user_id),
	UNIQUE (user_tok)
);