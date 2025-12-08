const validateTitle = (request, response, next) => {
    const { body } = request

    if (body.title === undefined)
        return response.status(400).json({message: 'The field title is requeried'})
    if (body.title === '')
        return response.status(400).json({message: 'The field has no title on it'})
    
    next()
}

const validateStatus = (request, response, next) => {
    const { body } = request

    if (body.status === undefined)
        return response.status(400).json({message: 'The field status is required'})
    if (body.title === "" && body.status === "")
        return response.status(400).json({message: 'The field has no status on it'})

    next()
}

module.exports = {
    validateTitle,
    validateStatus
}