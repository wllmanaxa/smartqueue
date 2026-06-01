namespace Backend.DTOs.Common;

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPrevious => PageNumber > 1;
    public bool HasNext => PageNumber < TotalPages;
}

public class PaginationQuery
{
    private int _pageNumber = 1;
    private int _pageSize = 10;

    public int PageNumber
    {
        get => _pageNumber;
        set => _pageNumber = value < 1 ? 1 : value;
    }

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value is < 1 or > 100 ? 10 : value;
    }
}

public class SortQuery
{
    /// <summary>Field name (camelCase or PascalCase).</summary>
    public string? SortBy { get; set; }
    /// <summary>asc or desc.</summary>
    public string? SortDirection { get; set; } = "asc";
}

public class SearchQuery : PaginationQuery
{
    public string? Search { get; set; }
}
