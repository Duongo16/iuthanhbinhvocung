using CuteDatingScheduler.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace CuteDatingScheduler.Api.Controllers;

[ApiController]
public abstract class CatalogControllerBase<TEntity, TRequest> : ControllerBase
    where TEntity : EntityBase, new()
{
    protected abstract IMongoCollection<TEntity> Collection { get; }
    protected abstract TEntity Map(TRequest request, TEntity entity);
    protected virtual Task<string?> ValidateAsync(TRequest request, CancellationToken ct) =>
        Task.FromResult<string?>(null);
    protected virtual Task<string?> ValidateDeleteAsync(string id, CancellationToken ct) =>
        Task.FromResult<string?>(null);

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var items = await Collection.Find(Builders<TEntity>.Filter.Empty)
            .SortByDescending(x => x.CreatedAt).ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, CancellationToken ct)
    {
        if (!ObjectId.TryParse(id, out _)) return BadRequest(new { message = "ID không hợp lệ." });
        var item = await Collection.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
        return item is null ? NotFound() : Ok(item);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TRequest request, CancellationToken ct)
    {
        var error = await ValidateAsync(request, ct);
        if (error is not null) return BadRequest(new { message = error });
        var item = Map(request, new TEntity { Id = ObjectId.GenerateNewId().ToString() });
        item.CreatedAt = item.UpdatedAt = DateTime.UtcNow;
        await Collection.InsertOneAsync(item, cancellationToken: ct);
        return CreatedAtAction(nameof(Get), new { id = item.Id }, item);
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] TRequest request, CancellationToken ct)
    {
        if (!ObjectId.TryParse(id, out _)) return BadRequest(new { message = "ID không hợp lệ." });
        var item = await Collection.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
        if (item is null) return NotFound();
        var error = await ValidateAsync(request, ct);
        if (error is not null) return BadRequest(new { message = error });
        Map(request, item);
        item.UpdatedAt = DateTime.UtcNow;
        await Collection.ReplaceOneAsync(x => x.Id == id, item, cancellationToken: ct);
        return Ok(item);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        if (!ObjectId.TryParse(id, out _)) return BadRequest(new { message = "ID không hợp lệ." });
        var error = await ValidateDeleteAsync(id, ct);
        if (error is not null) return Conflict(new { message = error });
        var result = await Collection.DeleteOneAsync(x => x.Id == id, ct);
        return result.DeletedCount == 0 ? NotFound() : NoContent();
    }
}
