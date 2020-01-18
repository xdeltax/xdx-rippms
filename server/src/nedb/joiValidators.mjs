import Joi from '@hapi/joi';

// dbusers
export const joi_databaseid = 	Joi.string().alphanum().allow(null).allow("").max(200).normalize();

export const joi_userid = 			Joi.string().alphanum().min(30).max(50).normalize();
export const joi_servertoken =	Joi.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/).min(30).max(499).normalize();

export const joi_memberstatus = Joi.array().items( Joi.number().integer().min(0).max(99).optional() );
export const joi_accountstatus= Joi.array().items( Joi.number().integer().min(0).max(99).optional() );
export const joi_createdAt = 	  Joi.date();
export const joi_updatedAt = 	  Joi.date();

// private
export const joi_uid = 				  Joi.string().allow('').min(0).max(99).alphanum().normalize();
export const joi_fingerprint =  Joi.string().min(10).max(40).alphanum().normalize();
export const joi_provider =     Joi.string().trim().min(1).max(50).alphanum().normalize();
export const joi_providerid =   Joi.string().trim().min(1).max(50).alphanum().normalize();
export const joi_providertoken= Joi.string().min(30).max(499).normalize();
export const joi_forcenew = 		Joi.string().trim().min(1).max(99);

export const joi_name = 				Joi.string().alphanum().allow("").max(50).normalize();
export const joi_email = 			  Joi.string().max(256).email().allow("").allow(null).normalize().default("");
export const joi_phonenumber =  Joi.string().max(64).allow("").allow(null).normalize().default("");

// dbsockets
//const joi_socketid 	=	Joi.string().alphanum().allow("-").min(10).max(50).normalize();
export const joi_socketid =	    Joi.string().regex(/^[A-Za-z0-9-_.+/=]*$/).min(10).max(50).normalize();
export const joi_count =	      Joi.number().min(0);
export const joi_date =         Joi.date();
