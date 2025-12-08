const validateTitle = (request, response, next) => {
    const { body } = request

    if (body.title === undefined)
        return response.status(400).json({message: 'The field title is requeried'})
    if (body.title === '')
        return response.status(400).json({message: 'The field has no title on it'})
    
    next()
}

const validateTask = (request, response, next) => {
    const { body } = request

    if (body.title === undefined && body.status === undefined)
        return response.status(400).json({message: 'The field is lacking information'})
    if (body.title === "" && body.status === "")
        return response.status(400).json({message: 'The field was not filled properly'})

    next()
}

module.exports = {
    validateTitle,
    validateTask
}