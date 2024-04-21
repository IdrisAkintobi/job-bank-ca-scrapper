import Joi from 'joi';

export const configValidationSchema = Joi.object({
    BASE_URL: Joi.string().uri().required(),
    LMIA_APPROVED_EMPLOYER_PAGE: Joi.string().uri().required(),
    LMIA_PENDING_EMPLOYER_PAGE: Joi.string().uri().required(),
    EMAIL_HOST: Joi.string().required(),
    EMAIL_PORT: Joi.number().required(),
    EMAIL_SECURE: Joi.boolean().required(),
    EMAIL_USER: Joi.string().required(),
    EMAIL_PASSWORD: Joi.string().required(),
    SENDER_NAME: Joi.string().required(),
    SAVE_TO_DB: Joi.boolean().default(true),
    SAVE_TO_CSV: Joi.boolean().default(true),
});
