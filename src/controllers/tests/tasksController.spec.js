const tasksController = require('../tasksController.js')
const taskSchema = require('../../models/taskSchema')
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const PDFDocument = require("pdfkit")

jest.mock('pdfkit')
jest.mock('../../models/taskSchema')
jest.mock('@aws-sdk/client-s3', () => {
    const sendMock = jest.fn().mockResolvedValue({
        ETag: '"mocked-etag"',
        Location: 'https://fake-bucket.s3.amazonaws.com/fake-image.jpg',
    });

    return {
        S3Client: jest.fn(() => ({
        send: sendMock,
        })),
        PutObjectCommand: jest.fn((params) => params),
        DeleteObjectCommand: jest.fn((params) => params),
    };
});

describe("Tasks controller", ()=>{
    let mockRequest, mockResponse, s3

    beforeEach(() => {
        mockRequest = {
            params: { id: '123' },
            body: { title: 'Task atualizada', description: 'Nova descrição' },
            file: null
        }

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        s3 = new S3Client()
        jest.clearAllMocks()
    })

    test("Should fetch all tasks from BD", async () => {
        const mockTasks = [
            {title: "Task 1"},
            {title: "Task 2"}
        ]

        taskSchema.find.mockResolvedValue(mockTasks)
        
        const request = {};
        const response = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await tasksController.getAll(request, response);

        expect(taskSchema.find).toHaveBeenCalledTimes(1);
        expect(taskSchema.find).toHaveBeenCalledWith()
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith(mockTasks);
    })

    test("Should return a task by ID", async () => {
        const mockTask = {_id: '1', title: 'Task 1'}
        taskSchema.findById.mockResolvedValue(mockTask)
        
        const request = {params: {id: '1'}}
        const response = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await tasksController.getById(request, response);

        expect(taskSchema.findById).toHaveBeenCalledTimes(1);
        expect(taskSchema.findById).toHaveBeenCalledWith('1')
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith(mockTask);
    })

    test('Should create a task with image upload', async () => {
        mockRequest.file = {
            originalname: 'foto.png',
            buffer: Buffer.from('fake image'),
            mimetype: 'image/png'
        }

        const fakeTask = { _id: '124', title: 'Com Imagem', description: 'Task com imagem', imageUrl: 'https://s3.amazonaws.com/foto.png' }
        taskSchema.create.mockResolvedValue(fakeTask)
        s3.send.mockResolvedValue({})

        await tasksController.createTask(mockRequest, mockResponse)

        expect(s3.send).toHaveBeenCalled()
        expect(taskSchema.create).toHaveBeenCalled()
        expect(mockResponse.status).toHaveBeenCalledWith(201)
        expect(mockResponse.json).toHaveBeenCalledWith(fakeTask)
    })

    test("Should delete a task by id", async () => {
        const mockDeletedTask = {_id: '1', title: 'Task to be deleted'}
        taskSchema.findByIdAndDelete.mockResolvedValue(mockDeletedTask)

        const request = { params: {id: '1'} }
        const response = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await tasksController.deleteTask(request, response)

        expect(taskSchema.findByIdAndDelete).toHaveBeenCalledTimes(1);
        expect(taskSchema.findByIdAndDelete).toHaveBeenCalledWith(request.params.id)
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith(mockDeletedTask);
    })

    test('Should update a task with new content and image', async () => {
        const oldTask = { _id: '123', imageUrl: 'https://bucket.s3.region.amazonaws.com/antiga.png' }
        const updatedTask = { _id: '123', title: 'Nova', description: 'Com nova imagem', imageUrl: 'https://bucket.s3.region.amazonaws.com/nova.png' }

        mockRequest.file = {
            originalname: 'nova.png',
            buffer: Buffer.from('fake image'),
            mimetype: 'image/png'
        }

        taskSchema.findById.mockResolvedValue(oldTask)
        s3.send.mockResolvedValueOnce({}) // delete antigo
        s3.send.mockResolvedValueOnce({}) // upload novo
        taskSchema.findByIdAndUpdate.mockResolvedValue(updatedTask)

        await tasksController.updateTask(mockRequest, mockResponse)

        expect(s3.send).toHaveBeenCalledTimes(2)
        expect(DeleteObjectCommand).toHaveBeenCalled()
        expect(PutObjectCommand).toHaveBeenCalled()
        expect(mockResponse.status).toHaveBeenCalledWith(200)
        expect(mockResponse.json).toHaveBeenCalledWith(updatedTask)
    });

    test("Should return a PDF", async () => {
        const mockTasks = [
            {id:'1', title: 'Test A', status: 'concluído', created_at: new Date('2025-01-02')},
            {id:'2', title: 'Test B', status: 'pedente', created_at: new Date('2025-01-02')}
        ]
        taskSchema.find.mockResolvedValue(mockTasks)

        const mockPipe = jest.fn();
        const mockFontSize = jest.fn().mockReturnThis();
        const mockText = jest.fn().mockReturnThis();
        const mockMoveDown = jest.fn().mockReturnThis();
        const mockEnd = jest.fn();

        PDFDocument.mockImplementation(() => ({
            pipe: mockPipe,
            fontSize: mockFontSize,
            text: mockText,
            moveDown: mockMoveDown,
            end: mockEnd
        }));

        const request = {}
        const response = {
            setHeader: jest.fn()
        }

        await tasksController.gerarPdf(request, response)
        
        expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
        expect(response.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=lista_livros.pdf');

        expect(mockPipe).toHaveBeenCalledWith(response);
        expect(mockFontSize).toHaveBeenCalledWith(18);
        expect(mockText).toHaveBeenCalledWith('Lista de Tarefas', { align: 'center' });
        expect(mockMoveDown).toHaveBeenCalled();

        expect(taskSchema.find).toHaveBeenCalledTimes(1);

        expect(mockText).toHaveBeenCalledWith(
            expect.stringMatching(/ID: 1/)
        );
        expect(mockText).toHaveBeenCalledWith(
            expect.stringMatching(/ID: 2/)
        );

        expect(mockEnd).toHaveBeenCalled();

    })

})