import Joi from 'joi';

export const configValidationSchema = Joi.object({
    BASE_URL: Joi.string().uri().required(),
    LMIA_APPROVED_EMPLOYER_PAGE: Joi.string().uri().required(),
    LMIA_PENDING_EMPLOYER_PAGE: Joi.string().uri().required(),
});
